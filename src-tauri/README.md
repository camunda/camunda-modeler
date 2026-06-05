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
  app/                      Thin Tauri shell: ipc_dispatch command + window/shim wiring
  preload-shim.js           Reconstructs window.getAppPreload()/backend over Tauri IPC
  frontend-placeholder/     Phase-0 stand-in for app/public (see below)
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
Exposes one `#[tauri::command] ipc_dispatch(event, args)` that calls
`modeler_backend::dispatch`, and injects two init scripts before the renderer
loads: boot constants (`window.__MODELER_BOOT__`) and `preload-shim.js`.

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

## Phase 0 status & known gaps

- ✅ file-system slice + 15 parity tests; Tauri shell compiles.
- `frontend-placeholder/` is a temporary `frontendDist`. **Phase 1** repoints
  `app/tauri.conf.json` `frontendDist` to `../../app/public` (run
  `npm run client:build` first) and boots the real renderer.
- `file:get-path` (Electron `webUtils`) has no portable web equivalent; the shim
  returns `null` for now — revisit in the drag-and-drop phase.
- Most events are still `ERR_NOT_IMPLEMENTED` (config, dialog, workspace,
  file-context, zeebe, menu, ...). See the phased plan.
- `icons/icon.png` is a placeholder; real branding assets come with packaging.
