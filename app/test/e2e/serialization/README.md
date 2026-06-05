# IPC serialization probe (E2E)

This is the first piece of the E2E smoke phase for the planned Rust/Tauri
backend migration. It characterizes the **real Electron IPC structured-clone
serialization** — the one part of the IPC contract the Node-only contract suite
(`app/lib/__tests__/ipc-contract`) cannot observe, because that suite runs under
plain Node rather than an Electron runtime.

The invariants asserted here are the cross-language oracle a future Rust/Tauri
backend must reproduce, since the unchanged renderer depends on them.

## What it does

`serialization-probe-spec.js` spawns a real Electron process (`probe-main.js`)
that boots a hidden window wired with the **real** preload (`app/lib/preload.js`)
and the **real** main-side dispatch (`app/lib/util/renderer.js`). The renderer
(`probe-renderer.js`) round-trips a battery of values through the genuine
`backend` IPC bridge in both directions and reports the observed shapes, which
the spec asserts.

## Key findings locked by this probe

- `Buffer` (main) is delivered to the renderer as a **`Uint8Array`**, not a
  `{ type: 'Buffer', data: [...] }` object. A JSON-based backend would diverge.
- **`undefined` is preserved** in both objects and arrays (`[1, undefined, 3]`).
  A JSON-based backend would silently drop it.
- `Date` is preserved as a `Date` instance; `null` is preserved.
- A rejected `Error` arrives as a **plain object** carrying enumerable `message`
  and `code` (forced by `renderer.js`) plus the underlying error's own
  enumerable props (e.g. `errno`, `path`, `syscall`).

## Running

Requires a real Electron runtime. It is **skipped by default** (so
`npm run app:test` stays green in headless CI) and runs only when `RUN_E2E=true`:

```sh
npm run app:test-e2e
```

On Linux CI a virtual display is required, e.g.:

```sh
xvfb-run -a npm run app:test-e2e
```

## Faithfulness note

Production uses `sandbox: true` with a webpacked preload; the probe uses
`sandbox: false` so the source preload/renderer modules load directly.
Structured-clone serialization is independent of the sandbox flag.
