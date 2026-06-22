# Integration (e2e) tests

End-to-end tests that drive the real Electron app to automate the release
[integration test checklist](../../docs/.project/INTEGRATION_TEST.md).

They launch the built app with [Playwright](https://playwright.dev/)'s Electron
runner, drive it the way a user would, and assert on real files written to disk.

They cover the editor- and app-level items of the checklist (modeling, save/open,
export, properties, validation, problems panel, menus, flags)

## Running

The tests launch the built app from `app/`, so build it first:

```bash
npm run build        # produces app/public + app/preload
npm run test:e2e     # the full suite
```

Run a single spec or filter by title:

```bash
npx playwright test -c test/e2e/playwright.config.js smoke
npx playwright test -c test/e2e/playwright.config.js -g "Save File As"
```

On failure, a Playwright trace and an `error-context.md` land under
`test/e2e/test-results/` (inspect a trace with `npx playwright show-trace
<trace.zip>`). See [Debugging](#debugging) for more.

## Debugging

### Trace (full run, start to finish)

The harness records a Playwright trace on its own — DOM snapshots, the action
log, network and console — and keeps it **on failure automatically**, or
**always** with `E2E_TRACE=1`. Two scripts wrap this:

```bash
npm run test:e2e:trace        # run all tests, keep a trace per test
npm run test:e2e:show-trace   # open the HTML report; click any test -> its trace
```

Under the hood that is `cross-env E2E_TRACE=1 ...` and
`playwright show-report test/e2e/playwright-report`. The report lists every
test from the last run with its trace, so you see all of them in one place
(`show-trace` itself only opens a single trace file). To open a single trace
directly: `npx playwright show-trace test/e2e/test-results/<test>/trace.zip`.

To trace one test, add a filter:
`npm run test:e2e:trace -- -g "open a BPMN"`.

Wrap steps in `app.step(name, fn)` to label them as milestones in the trace's
action list — useful for steps with no visible page activity (menu actions,
dialog handling, on-disk assertions), so the trace reads clearly:

```js
await app.step('save as new file', async () => {
  await app.expectSaveDialog(output);
  await app.shortcut('CommandOrControl+Shift+S');
});
```

## How the app is driven

We favour real UI over mocking:

- **Shortcuts** (Save `+S`, Save As `+Shift+S`, Export `+Shift+E`, Copy `+C`,
  Paste `+V`, Undo, Redo, Select All, ...) are native menu accelerators that
  don't fire from injected keystrokes. So `app.shortcut('CommandOrControl+S')`
  looks up the command
  *bound to that accelerator*, checks it's enabled, and invokes it as the
  accelerator would (with `triggeredByAccelerator`). This drives the real
  binding — it fails if the shortcut is rebound, unbound, or wrongly disabled.
  The one part not exercised is the OS delivering the keystroke (the OS's job).
- **Native file dialogs** are the only stubbed surface: `app.expectSaveDialog(path)`
  replaces only the picker's return value; the app then performs the real file
  write. Plain Save on a file that already has a path needs no stub.

## Launch defaults

Each test gets a fresh, throwaway `--user-data-dir`, and the app launches with
`--disable-remote-interaction=true` — this turns off telemetry, update checks
and the first-run **Privacy Preferences** modal (which would otherwise cover the
app on every launch, since the profile is empty).

## Layout

```
harness/       ElectronApp launcher, fixtures (test.js), menu,
               the dialog seam, file + path + svg helpers
pages/         page objects (intent, not selectors)
fixtures/      input diagrams
__snapshots__/ golden export baselines (expected outputs)
specs/         the tests
```

## Export baselines

Image/SVG exports are compared against golden files in `__snapshots__/`
(e.g. `simple.png`). PNG/JPEG compare pixel-wise (with a small
`maxDiffPixelRatio` tolerance); SVG compares normalized markup (the random
`marker-…` / `djs-grid-pattern-…` ids are stripped first). One shared baseline is
used across platforms.

Regenerate the baselines after an intentional export change:

```bash
npm run test:e2e:update   # playwright test ... --update-snapshots
```

## Continuous integration

CI ([`.github/workflows/CI.yml`](../../.github/workflows/CI.yml)) runs the suite
as a dedicated **`e2e-tests`** job, on the Linux (Xvfb) / macOS / Windows matrix.
It builds preload + client inline (`npm run preload:build && npm run
client:build`) and runs in parallel with the `build` job, so e2e results are
reported separately from build and unit tests.
