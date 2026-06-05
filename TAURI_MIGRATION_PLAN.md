# Tauri / Rust backend migration — remaining plan

> Status snapshot as of 2026-06-05. Branch: `prototype/tauri-backend`
> (cut from `prototype/tauri-ipc-contract-tests`). Phases 0–4 are **done**;
> this document captures the **remaining** work (Phases 5–6) plus the standing
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

Total cargo tests at the Phase-4 commit: **72** (17 config + 15 file_system +
7 flags + 11 watcher + 5 workspace + 17 file_context). Note: CI does **not** yet
run `cargo` — the prototype is not wired into `.github/workflows/CI.yml`.

---

## Phase 5 — file-context IPC wiring + watcher↔indexer integration

Goal: make the ported watcher (Phase 3) and indexer/processors (Phase 4)
observable to the renderer through the existing `file-context:*` IPC contract,
so the renderer's file-context features (cross-file linking, process-application
awareness) work end-to-end on the Rust backend.

### Scope

1. **Watcher ↔ indexer integration.** Bridge `WatcherEvent` → indexer calls,
   mirroring `indexer.js`'s event-bus subscriptions:
   - `WatcherEvent::Add(uri)` → `indexer.add(uri, None)`
   - `WatcherEvent::Change(uri)` → `indexer.file_updated(uri, None)`
   - `WatcherEvent::Remove(uri)` → `indexer.remove(uri)`
   - `WatcherEvent::Changed` (debounced) → drives the `file-context:changed`
     emit (see below).
   The indexer was deliberately built **synchronous** in Phase 4; this phase
   must decide the concurrency model (likely the indexer lives behind a
   `Mutex`/actor on a dedicated thread, fed by the watcher's worker thread, so
   the `notify` callback never blocks). Re-check the Phase-3 fidelity notes:
   roots are canonicalized; duplicate `Add`s are harmless (idempotent by URI).

2. **The async ready-gate (`workqueue` / `workqueue:empty`).** Phase 4 cut the
   async workqueue. Port `workqueue.js` (simple Set-based pending tracker) so a
   burst of adds resolves to a single "settled" signal before
   `file-context:changed` is emitted, matching the JS `waitForEvent(...,
   'workqueue:empty')` semantics the spec relies on.

3. **The `file-context:*` IPC surface.** Wire these contract events through
   `ipc_dispatch` (and the `file-context.js` orchestration they correspond to):
   - inbound: `file-context:add-root`, `file-context:remove-root`,
     `file-context:file-opened`, `file-context:file-updated`,
     `file-context:file-closed`
   - outbound: `file-context:changed` (the aggregated index broadcast to the
     renderer). Serialize indexer items via `IndexItem::to_value()`
     (`{ uri, processor, file, metadata }`) — the `serde_json::Value` shapes
     were chosen in Phase 4 precisely so this is trivial.

4. **`findProcessApplicationFile` + add-root-on-open discovery.** Port the
   `processors/util.js` `findProcessApplicationFile` walk (ascend dirs looking
   for a `.process-application`) and the `file-context.js` behavior that adds the
   containing directory as a watch root when a process-application file is
   opened/discovered.

5. **Renderer plumbing.** Confirm the renderer's file-context client receives
   `file-context:changed` and reacts identically to Electron (no renderer code
   changes expected; this is a verification step).

### Parity oracle

- Reuse `app/lib/file-context/__tests__/file-context-spec.js` as the behavioral
  oracle. The processing + error-handling cases are already mirrored in
  `tests/file_context_parity.rs`; this phase adds the **integration** cases:
  add-root → scan → `changed` payload, file-opened/updated/closed lifecycle,
  process-application discovery, and the `workqueue:empty` settle timing.
- Prefer a cargo integration test driving watcher+indexer over real temp-dir fs
  ops (as Phase 3 did), plus — if feasible — a Tauri probe + driver spec in
  `app/test/e2e/file-context/` reusing the JS assertions end-to-end.

### Risks / watch-items

- Threading: the `notify` callback must not block on indexer work; pick the
  actor/queue model deliberately and get a rubber-duck design critique first
  (consistent with prior phases).
- `file-context:changed` payload shape + ordering must match what the renderer
  expects (array order matters; object key order does not).
- macOS FSEvents trailing-modify-after-delete is already handled in the watcher
  (stat-before-emit) — keep that invariant when integrating.

---

## Phase 5 (parallel track) — zeebe-api (Camunda 8 deploy/run)

> The hard one. Can proceed independently of the file-context IPC work.

Port `app/lib/zeebe-api` — the Camunda 8 client used for deploy / start-instance
/ connectivity checks. Considerations:

- Transport: Zeebe gRPC **and** the Camunda 8 REST API (the JS client supports
  both; SaaS uses OAuth client-credentials, Self-Managed may use OAuth or none).
  Decide on a Rust gRPC stack (e.g. `tonic`) vs. REST-first (`reqwest`).
- Auth: OAuth2 client-credentials token cache + refresh; mTLS / self-signed CA
  options that the Electron client exposes.
- Surface the same IPC contract events (`zeebe:deploy`, `zeebe:run`,
  `zeebe:checkConnection`, config/endpoint variants) and **identical error
  shapes** — the renderer surfaces these messages verbatim.
- Parity oracle: the IPC contract suite + any zeebe-api unit tests on the parent
  branch. This slice likely needs a mock/stub Zeebe endpoint for hermetic tests.

This is the largest remaining behavioral surface and the most likely to need its
own multi-slice breakdown (transport → auth → deploy → run → connection-check).

---

## Phase 6 — shell integration & packaging

The remaining "app shell" surface, largely Tauri-native rather than pure logic:

- **Native menu** (`app/lib/menu`) — application menu, context menus, accelerators,
  enable/disable state synced from the renderer's menu-state updates.
- **Native dialogs** — file open/save, message boxes, error dialogs (explicitly
  cut in Phase 2; the file-system slice needs these for full open/save flows).
- **Plugins** (`app/lib/plugins`) — discovery + loading of user/extension plugins
  (menu, script, style, client-extension entry points).
- **Error tracking** — the Electron crash/error reporting path.
- **Packaging + auto-update** — bundle the Tauri app for win/mac/linux; replace
  electron-builder + the Electron auto-updater with the Tauri updater; code
  signing / notarization.

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
- **Phase 2 — native dialog.** Deferred to Phase 6 (see above).
- **Phase 3 — atomic-save coalescing.** chokidar's per-file `atomic:300`
  write-replace coalescing is not mirrored; an editor's write-replace may surface
  as `Remove` + `Add`. Eventually consistent via the indexer's URI reconciliation,
  but verify it doesn't cause a visible flicker in `file-context:changed`.
- **Phase 4 — async workqueue.** The indexer is synchronous; the
  `workqueue:empty` ready-gate is folded into Phase 5.
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
