# Tauri / Rust backend (prototype)

Prototype replacement of the Electron main process (`app/lib`) with a Rust/Tauri
backend. The React + bpmn.io renderer (`client/`, built to `app/public`) is
**unchanged**; parity is guarded by the safety net on
`prototype/tauri-ipc-contract-tests` (IPC contract suite + serialization oracle
+ backend-agnostic lifecycle parity oracle).

## Layout

```
src-tauri/
  crates/modeler-backend/   Pure Rust backend logic (NO tauri dep) + parity tests
  crates/lifecycle-probe/   Headless Tauri lifecycle parity probe (own frontendDist)
  app/                      Thin Tauri shell: ipc_dispatch + boot IPC + boot probe
  preload-shim.js           Reconstructs window.getAppPreload()/backend over Tauri IPC
  frontend-placeholder/     Minimal probe page for the lifecycle probe (see below)
```

### `modeler-backend` (the substance)
Tauri-free so it compiles and tests in seconds. Holds the parity-critical
behavior. Currently implements the file-system slice (`file:read`,
`file:write`, `file:read-stats`) as a faithful port of `app/lib/file-system.js`
(including the `createFile` quirks), plus:
- `dispatch(event, args)` — event router mirroring `app/lib/util/renderer.js`,
  enforcing the same allow-list as `app/lib/preload.js`.
- `IpcError` — error object shaped like Electron/Node (`message`, `code`,
  `errno`, `syscall`, `path`).

### `app` (thin shell)
Exposes one `#[tauri::command] ipc_dispatch(window, event, args)` that routes via
`app/src/ipc.rs`, and injects two init scripts before the renderer loads: boot
constants (`window.__MODELER_BOOT__`) and `preload-shim.js`.

`app/src/ipc.rs` handles the stateful/effectful boot events (which need process
state or a webview effect, so they can't live in the pure crate): `config:get`
/`config:set` (in-memory `AppState`; `editor.id` lazily seeded with a v4 UUID
like Electron's `UUIDProvider`), `workspace:restore`/`save`, `client:ready`
(emits the `client:started` push the renderer waits on), and a no-op allow-list
for fire-and-forget boot calls. Everything else falls back to
`modeler_backend::dispatch`.

`app/src/bin/boot_probe.rs` is a headless probe that boots the **real** renderer
(`app/public`) and asserts the full handshake (`client:ready` →
`client:started` round-trip) completes with no uncaught renderer error — driven
by `app/test/e2e/boot/boot-tauri-spec.js`.

### `crates/lifecycle-probe` (parity probe)
A separate crate so it can embed its own `frontendDist`
(`frontend-placeholder`, a minimal page) instead of the product `app/public`
bundle — Tauri embeds exactly one frontend per crate at build time, so the
lifecycle probe and the product app cannot share a crate. The `lifecycle_probe`
bin drives the shared `lifecycle-journey.js` through the real shim + Tauri
`invoke` + the Rust dispatch, feeding the SAME `defineLifecycleSuite`
assertions that judge the Electron backend.

### `preload-shim.js`
Rebuilds the exact `backend` API the renderer used under Electron
(`send/on/once/...`) over Tauri `invoke` + events, and bridges the
serialization gaps the oracle found by carrying `Uint8Array`/`Date` as tagged
values in both directions.

## Building / testing

```sh
cd src-tauri

# fast: the parity-critical logic, no WebKit toolchain
cargo test -p modeler-backend

# compile the Tauri shell (pulls the Tauri toolchain)
cargo check -p camunda-modeler-tauri
```

The lifecycle parity + real-renderer boot probes run from the repo root under
`RUN_E2E=true npm run app:test-e2e` (they build the probes on demand and require
a built client bundle, `npm run client:build`).

## Status & known gaps

- ✅ Phase 0: file-system slice + 15 parity tests; Tauri shell compiles.
- ✅ Phase 1: lifecycle parity oracle passes against the Rust backend, and the
  **real bpmn.io renderer boots** under Tauri (config read + workspace restore +
  `client:ready`/`client:started` handshake) with no uncaught errors.
- `file:get-path` (Electron `webUtils`) has no portable web equivalent; the shim
  returns `null` for now — revisit in the drag-and-drop phase.
- Config/workspace are in-memory only (no disk persistence yet); 
  file-context, plugins, packaging are still to come. Most non-boot
  events remain `ERR_NOT_IMPLEMENTED`. See the phased plan. (Zeebe and file dialogs are implemented).
- The boot capabilities (`app/capabilities/default.json`) are broad
  (`withGlobalTauri`, `csp: null`); tighten to least-privilege before shipping.
- `icons/icon.png` is a placeholder; real branding assets come with packaging.
