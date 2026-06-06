# Tauri / Rust backend migration — remaining plan

> Status snapshot as of 2026-06-05. Branch: `prototype/tauri-backend`
> (cut from `prototype/tauri-ipc-contract-tests`). Phases 0–4 and the Phase-5
> dialogs + file-context slices are **done**; this document captures the
> **remaining** work (the zeebe network client + Phase 6) plus the standing
> scope cuts that still need to be paid back.

## Premise (unchanged)

Replace the Electron main process (`app/lib`, ~12k LOC Node) with a Rust/Tauri
backend. The React + bpmn.io renderer (`client/`, builds to `app/public`) stays
**unchanged**. Parity is proven by the safety net on the parent branch:

- `app/lib/__tests__/ipc-contract` — Node IPC contract suite
- `app/test/e2e/serialization` — real-IPC serialization oracle
- `app/test/e2e/lifecycle` + `app/test/e2e/shared` — backend-agnostic lifecycle
  parity oracle (a Tauri driver reuses the same `defineLifecycleSuite`)

## Architecture (unchanged)

- **Pure-logic lib crate** `src-tauri/crates/modeler-backend` with **no** Tauri
  dependency: fast `cargo test`, holds the parity-critical behavior.
- **Thin Tauri app crate** `src-tauri/app` depends on the lib + `tauri`, exposes
  a single `ipc_dispatch(event, args)` command that routes by contract event
  name (mirrors `app/lib/util/renderer.js`'s `on(event, ...)` dispatch; keeps
  contract identifiers like `file:read` intact).
- **Preload-compat shim** reconstructs `window.getAppPreload()` + `backend`
  (`send/on/once/...`) over Tauri `invoke` + events, so the renderer is
  unchanged.

## Done so far (for context)

| Phase | Summary |
|------|---------|
| 0 | Workspace scaffold; `file:read` / `file:write` / `file:read-stats` ported to `modeler-backend`, faithful to `file-system.js` `createFile`; `ipc_dispatch` router + `tauri.conf.json` + JS preload shim. |
| 1 | Lifecycle parity oracle passes against the Rust backend via a headless Tauri probe; the **real bpmn.io renderer boots** under Tauri (boot-path IPC: config/workspace/`client:ready` → `client:started`, `editor.id` UUID seeding). |
| 2 | `config` (persisted store), `flags`, `workspace` ported (`config.rs`/`flags.rs`/`workspace.rs`) + wired into the Tauri layer (`AppState`, `app.path().app_config_dir()`); 17 + 5 + 7 cargo parity tests. |
| 3 | file-context **watcher** ported to the `notify` crate (`watcher.rs`); emits `Add`/`Change`/`Remove`/`Ready`/debounced `Changed`; 11 cargo parity tests. |
| 4 | file-context **indexer + processors** ported (`processors.rs` + `indexer.rs`); 5 processors + router + synchronous read/process/message lifecycle; `roxmltree` (BPMN/DMN) + `quick-xml` Camunda-8 gate + `serde_json`; 17 cargo parity tests. |
| 5a | Native **dialogs + shell** ported (`app/src/dialog.rs`): open/save/message dialogs (`tauri-plugin-dialog`), file-explorer reveal + external URL open (`tauri-plugin-opener`), clipboard writes (`tauri-plugin-clipboard-manager`). Faithful to `dialog.js` + the shell handlers in `index.js` (defaultPath precedence, Linux ext-less-save fix, button label↔id mapping, defaultPath persistence). |
| 5b | file-context **IPC wiring + watcher↔indexer integration** (`file_context.rs`): ties the Phase-3 watcher to the Phase-4 indexer, ports `findProcessApplicationFile` + add-root-on-open + the file-closed process-application skip, and pushes the full `[{file,metadata}]` list via `file-context:changed`. Mutate→snapshot→emit under the indexer lock for ordered, atomic pushes. 6 cargo parity tests. |
| 5c (slice 1) | zeebe-api **pure helpers** ported (`zeebe_utils.rs`): SaaS URL detection, config/option sanitization, `removeV2OrSlashes`. 9 cargo parity tests mirroring `utils-spec.js`. |

Total cargo tests: **87** (17 config + 15 file_system + 7 flags + 11 watcher +
5 workspace + 17 file_context indexer/processors + 6 file_context orchestrator +
9 zeebe_utils). Note: CI does **not** yet run `cargo` — the prototype is not
wired into `.github/workflows/CI.yml`.

---

## ✅ Phase 5a/5b — done

Native dialogs/shell and the full `file-context:*` IPC surface (add-root,
remove-root, file-opened, file-updated, file-closed, and the
`file-context:changed` push) are wired end-to-end on the Rust backend. The
watcher↔indexer concurrency model (indexer shared behind `Arc<Mutex>`, every
operation does mutate→snapshot→emit under that lock so pushes are totally
ordered across the IPC thread and the watcher's worker/scan threads; a close
flag drops late events) was design-reviewed before implementation. The async
`workqueue:empty` ready-gate from Phase 4's scope cut is **not** needed in this
model: the Rust indexer is synchronous, so each watcher event's index work
completes inline and the resulting push already reflects a settled snapshot.

---

## Phase 5c — zeebe-api (Camunda 8 deploy/run) — **network client remaining**

> The hard one, and the largest remaining behavioral surface.

**Done (slice 1):** the network-free helpers in `app/lib/zeebe-api/utils.js`
are ported to `modeler-backend/src/zeebe_utils.rs` with 9 parity tests
(`tests/zeebe_utils_parity.rs`) — SaaS URL detection, secret/blob sanitization,
and `removeV2OrSlashes`.

**Remaining (the networked client).** Porting `zeebe-api.js` (868 LOC) +
`camunda-client-factory.js` (428 LOC) + `get-system-certificates.js` faithfully
is a multi-slice effort that **requires external infrastructure to verify** and
so is intentionally not stubbed with unverifiable code:

- **Transport.** Zeebe **gRPC** (deploy / createProcessInstance / topology for
  the gateway version) needs `tonic` + the **vendored Zeebe gateway `.proto`**;
  the Camunda 8 **REST** API (the `search*` endpoints + REST deploy/start
  variants) needs `reqwest`. The JS client supports both and auto-selects.
- **Auth.** OAuth2 client-credentials token cache + refresh; basic auth; the
  `none` case.
- **TLS.** mTLS + custom root cert string **and** system-certificate loading
  (`get-system-certificates.js` reads the OS trust store).
- **Contract + error shapes.** Surface `zeebe:checkConnection` / `deploy` /
  `startInstance` / `getGatewayVersion` / `search{ProcessInstances,Variables,
  Incidents,ElementInstances,Jobs,MessageSubscriptions,UserTasks}` with the
  **identical** `{ success, reason }` / response / error shapes (the renderer
  surfaces `reason` + messages verbatim; map gRPC status codes → the
  `ERROR_REASONS` set exactly).
- **Parity oracle.** `app/test/spec/zeebe-api/zeebe-api-grpc-spec.js` (2343 LOC)
  + `zeebe-api-rest-spec.js` (2575 LOC) + `camunda-client-factory-spec.js`. These
  mock the SDK; a Rust port needs an equivalent mock gateway/HTTP server for
  hermetic tests, **plus a live Camunda 8 cluster** to validate the real
  transport/auth/TLS paths end-to-end.

Suggested slice breakdown: connection-factory/endpoint config → REST `search*`
(reqwest + OAuth, most portable) → gRPC `deploy`/`startInstance`/topology (tonic
+ proto) → TLS/system-certs. Until then, the `zeebe:*` IPC events return the
parity-shaped `ERR_NOT_IMPLEMENTED` (the renderer's Zeebe panel degrades to a
connection error, as today).

---

## Phase 6 — shell integration & packaging

The remaining "app shell" surface, largely Tauri-native rather than pure logic:

- **Native menu** (`app/lib/menu`) — application menu, context menus, accelerators,
  enable/disable state synced from the renderer's menu-state updates.
- **Plugins** (`app/lib/plugins`) — discovery + loading of user/extension plugins
  (menu, script, style, client-extension entry points).
- **Error tracking** — the Electron crash/error reporting path.
- **Packaging + auto-update** — bundle the Tauri app for win/mac/linux; replace
  electron-builder + the Electron auto-updater with the Tauri updater; code
  signing / notarization (needs signing/notarization secrets).

---

## Standing scope cuts (debts to pay back)

Carried forward from earlier phases — track these so they aren't forgotten:

- **Phase 2 — flags sources.** Flags are read only from the user-data dir;
  Electron also scans bundled/`resources` dirs and accepts CLI overrides.
- **Phase 2 — element templates.** The `.camunda` element-template directory
  scan is stubbed to the persisted `elementTemplates`; the real filesystem scan
  is not ported.
- **Phase 2 — user-data migration.** The Rust user-data dir starts fresh; there
  is no migration from the existing Electron `userData` directory.
- **Phase 2 — native dialog.** ✅ Done (Phase 5a) via `tauri-plugin-dialog` +
  `-opener` + `-clipboard-manager`.
- **Phase 3 — atomic-save coalescing.** chokidar's per-file `atomic:300`
  write-replace coalescing is not mirrored; an editor's write-replace may surface
  as `Remove` + `Add`. Eventually consistent via the indexer's URI reconciliation,
  but verify it doesn't cause a visible flicker in `file-context:changed`.
- **Phase 4 — async workqueue.** ✅ Resolved (Phase 5b): the synchronous indexer
  makes the `workqueue:empty` ready-gate unnecessary — each push already reflects
  a settled snapshot. (Re-introduce only if the indexer is made async later.)
- **Phase 4 — moddle fidelity edge cases.** BPMN/DMN element identification uses
  `(namespace, local-name)` matching via `roxmltree` rather than full moddle type
  resolution. DMN decisions are matched against the exact dmn-moddle **DMN 1.3**
  namespace (`https://www.omg.org/spec/DMN/20191111/MODEL/`); revisit if Camunda
  bumps the DMN namespace. A `.bpmn` whose root is a foreign (unregistered)
  namespace but passes the zeebe Camunda-8 gate would yield empty metadata in
  Rust vs. a parse error in moddle — an accepted, low-likelihood divergence.
- **CI.** Wire `cargo build` / `cargo test` / `cargo clippy` for the
  `src-tauri` workspace into `.github/workflows/CI.yml` before this prototype is
  promoted past prototype status.

---

## Verified commands

```sh
# from src-tauri/ (the Rust workspace)
cargo test --workspace                          # all parity tests
cargo clippy -p modeler-backend --all-targets   # lints

# from repo root (JS, unchanged renderer / parent-branch oracles)
npm run lint
npm run app:test                                # Node app suite
RUN_E2E=true npm run app:test-e2e               # e2e (incl. Tauri drivers)
```
