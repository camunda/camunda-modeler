# Tauri / Rust backend migration — remaining plan

> Status snapshot as of 2026-06-05. Branch: `prototype/tauri-backend`
> (cut from `prototype/tauri-ipc-contract-tests`). Phases 0–4 and the Phase-5
> dialogs + file-context slices are **done**; this document captures the
> **remaining** work (Phase 6) plus the standing
> scope cuts that still need to be paid back. The zeebe REST client (Phase 5c)
> is now **done** (REST-only, verified against a live Camunda 8 cluster).

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
| 5c (slice 2) | zeebe-api **REST client** ported (`zeebe.rs`): all 11 `zeebe:*` operations (checkConnection/getGatewayVersion, deploy, startInstance, 7×search) over the Orchestration Cluster REST API via `reqwest`. Pure deploy-response mapping (gRPC-compatible `key`/`process`/`decision`/`decisionRequirements` aliases), request-body building, resource naming, and `getErrorReason`/`asSerializedError` mapping — 31 unit tests + 3 env-gated live tests against a real Camunda 8 cluster. Wired into the async `ipc_dispatch`. |

Total cargo tests: **121** (17 config + 15 file_system + 7 flags + 11 watcher +
5 workspace + 17 file_context indexer/processors + 6 file_context orchestrator +
9 zeebe_utils + 31 zeebe REST unit + 3 zeebe live). Note: CI does **not** yet run
`cargo` — the prototype is not wired into `.github/workflows/CI.yml`.

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

## Phase 5c — zeebe-api (Camunda 8 deploy/run) — **REST client done**

> Per explicit product direction, this port is **REST-only** (the Orchestration
> Cluster REST API). The Electron client also supported Zeebe **gRPC** and
> auto-selected; that transport is intentionally dropped here.

**Done (slice 1):** the network-free helpers in `app/lib/zeebe-api/utils.js`
are ported to `modeler-backend/src/zeebe_utils.rs` with 9 parity tests
(`tests/zeebe_utils_parity.rs`) — SaaS URL detection, secret/blob sanitization,
and `removeV2OrSlashes`.

**Done (slice 2):** the REST client (`modeler-backend/src/zeebe.rs`, Tauri-free,
async `reqwest` with `rustls-tls`). All 11 `zeebe:*` operations hit
`{base}/v2/{path}` where `base = removeV2OrSlashes(endpoint.url)`:

- `checkConnection`/`getGatewayVersion` → `GET /v2/topology` →
  `{ success, response: { protocol: 'rest', gatewayVersion } }`.
- `deploy` → multipart `POST /v2/deployments` (one `resources` part per file +
  optional `tenantId`), with the **exact** REST→gRPC response mapping the
  renderer depends on (`key`, and per-deployment `process`/`decision`/
  `decisionRequirements` aliases). Failure → `{ success:false, response:
  asSerializedError(err) }`.
- `startInstance` → `POST /v2/process-instances` (`processDefinitionKey` else
  `processDefinitionId`, JS-truthy selection; null/undefined body fields
  omitted).
- `search*` (process-instances, element-instances, variables [+`truncateValues=
  false`], incidents, jobs, message-subscriptions, user-tasks) →
  `POST /v2/<path>/search` with `{ filter: { processInstanceKey } }`.

The handlers **never reject** — they always resolve the `{ success, ... }`
parity object (`getGatewayVersion`/`search*` failures carry `reason`,
`deploy`/`startInstance` failures carry `response`). `getErrorReason` /
`asSerializedError` are ported faithfully; REST has no gRPC status codes, so
transport connect/timeout on the Zeebe endpoint is mapped to the code-14
equivalent (`CONTACT_POINT_UNAVAILABLE`/`CLUSTER_UNAVAILABLE`) and OAuth-token
transport failures steer toward `OAUTH_URL`/`INVALID_CLIENT_ID`. **Auth:** none,
basic, and OAuth client-credentials (Bearer) are implemented; Camunda Cloud uses
OAuth. Wired into the async `ipc_dispatch` (events prefixed `zeebe:` route to
`zeebe::handle(...).await` before the sync `ipc::handle`).

Proven by **31 unit tests** (pure logic: endpoint parse, resource naming +
Node `path` semantics, MIME, start-instance body, search body, the full
deploy-response mapping incl. alias priority, all 8 `getErrorReason` branches,
`asSerializedError`) + **3 env-gated live tests** (`tests/zeebe_live.rs`, gated
by `RUN_ZEEBE_LIVE=1`) that verify topology, a search, and a deploy→start
round-trip against a real Camunda 8 cluster.

**Scope cuts / not ported:** gRPC transport (dropped by design); mTLS + custom
root cert / system-certificate loading (`get-system-certificates.js`); per-
endpoint client + OAuth-token caching (the JS SDK caches; we build a fresh
request each call — an optimization, not observable behavior). The `none` plugin
mechanism has no first-party/core plugins to convert (every `plugins/*/index.js`
is a test/e2e fixture), so nothing was migrated there.

---

## Phase 6 — shell integration & packaging

The remaining "app shell" surface, largely Tauri-native rather than pure logic:

- **Native menu** (`app/lib/menu`) — ✅ application menu done (Phase 6a):
  `src-tauri/app/src/menu.rs` is a faithful port of `menu-builder.js`
  (File/Edit/Window/Help, dynamic editMenu/windowMenu, role→native predefined
  items with disabled-state fallback, provider newFileMenu/helpMenu, accelerator
  normalization). Driven by `menu:register`/`menu:update`; clicks emit
  `menu:action(action, options)` window-scoped to "main". Quit and the window
  close button defer to the renderer's unsaved-changes flow (emit
  `menu:action('quit')` → renderer → `app:quit-allowed` → `app.exit(0)`).
  **Still open:** context menus (`context-menu:open` is still a no-op stub);
  the DevTools toggle is a no-op in release builds unless the `devtools` feature
  is enabled; accelerator double-fire risk (native menu accelerators vs the
  renderer's own keyboardBindings) — drop native accelerators for
  renderer-owned actions if it occurs.
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
