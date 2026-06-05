# File lifecycle parity suite (E2E)

This is the second piece of the E2E smoke phase for the planned Rust/Tauri
backend migration. It exercises the **file `open → edit → save → reopen`
journey** across the real IPC boundary and — crucially — is structured as a
**backend-agnostic oracle** so the exact same journey and assertions can later
be run against a Rust/Tauri backend.

## Why this is structured as an oracle (read this first)

Today there is no Tauri backend, so this run only characterizes the **current
Electron backend**. Its value is the *second* run: the same assertions, re-run
against the Rust/Tauri backend, prove parity. To make that "literally the same
code" rather than a trusted manual port, the suite is split into three
backend-agnostic pieces under `app/test/e2e/shared/`:

| File | Role | Reused by every backend? |
| --- | --- | --- |
| `lifecycle-fixture.js` | Fixture contents + edit markers + expected file names (single source of truth) | ✅ unchanged |
| `lifecycle-journey.js` | The `open → edit → save → reopen` sequence, with the IPC transport **injected** as `call(event, ...args)` | ✅ unchanged |
| `lifecycle-suite.js` | The mocha `describe`/`it` assertion tree | ✅ unchanged |

Only the **driver** differs per backend. The Electron driver lives in
`app/test/e2e/lifecycle/`:

- `lifecycle-spec.js` — spawns Electron, runs the probe, hands the observations
  to `defineLifecycleSuite(...)`.
- `lifecycle-main.js` — Electron main wiring the **real** `file:read` /
  `file:write` / `file:read-stats` handlers (mirrors `app/lib/index.js`).
- `lifecycle-renderer.js` — injects the Electron `backend.send` transport into
  the shared journey.

## Independent on-disk verification

`lifecycle-suite.js` does not only trust what the renderer reports over IPC: it
also reads the saved file straight from disk (`readDisk()`, out-of-band) to
confirm the edited bytes actually persisted. So the assertion is genuinely
end-to-end, not a round-trip of the same in-memory value.

## Adding the Tauri driver later

Implement a second driver that reuses all three shared files:

1. A `call(command, ...args)` that maps the IPC contract event names to Tauri
   `invoke` and returns a `Promise` — inject it into
   `lifecycleJourney.runLifecycleJourney`.
2. A `setup()` that drives the journey, captures the reported observations and a
   `readDisk()` for the saved path, then:

   ```js
   defineLifecycleSuite({ label: 'tauri backend', setup });
   ```

The assertions in `lifecycle-suite.js` are **not touched** — that is what turns
"trust the manual port" into structurally enforced parity.

## Running

Requires a real Electron runtime (use `xvfb-run` on Linux CI). It is **skipped
by default** (so `npm run app:test` stays green in headless CI) and runs only
when `RUN_E2E=true`:

```sh
npm run app:test-e2e
```
