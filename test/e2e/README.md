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
npx playwright test -c test/e2e/playwright.config.js --project=base smoke
npx playwright test -c test/e2e/playwright.config.js --project=base -g "Save File As"
```

`npm run test:e2e` runs the `base` project only. The
[engine suite](#engine-suite-camunda-8-run) needs a running cluster and is
opted into separately.

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

## Engine suite (Camunda 8 Run)

`specs/engine/` covers the deployment and start-instance paths — the checklist's
items, plus DMN deployment, which it never covered — against a real
[Camunda 8 Run](https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/c8run/)
cluster. It is opt-in — the default run never boots an engine:

```bash
npm run test:e2e:engine
```

__Scope boundary: this suite tests what the modeler does to a cluster, not what
the cluster does afterwards.__ Assertions stop at the app's own UI — the success
notification and the Operate link it builds from the gateway's response. It does
not query the cluster, drive Operate, or complete tasks in Tasklist; those stay
in the [manual checklist](../../docs/.project/INTEGRATION_TEST.md).

### The cluster

The cluster lifecycle is __not part of the test run__. The tests assume a
cluster is already answering, so a boot failure is reported as a failed CI step
rather than as a failing test. CI starts and stops one around the suite; locally
you bring your own:

```bash
npm run c8run:start   # reuses a running cluster, or downloads and boots one
npm run test:e2e:engine
npm run c8run:stop    # stops it only if `c8run:start` started it
```

If no cluster is answering, the specs fail waiting for the status bar's
connection check to report success, rather than on anything subtler. They gate
on that positive state because the overlay's "Could not establish connection"
feedback is equally absent before the check has run — waiting for it to be
hidden would pass immediately and submit against an unresolved connection.

`harness/c8run.js` owns the lifecycle and doubles as that CLI
(`node test/e2e/harness/c8run.js start|stop`):

* __A cluster already answering on `http://localhost:8080/v2` is reused.__ If you
  are working on deployment you likely have one running; the suite uses it
  rather than booting a second. Its gateway version is logged and, if it does
  not match the pinned line, warned about — a local pass against an older engine
  is not evidence CI will pass.
* __Otherwise one is downloaded, extracted to `.c8run/` and started__ with
  `--disable-connectors` (nothing here needs a job worker). That is the only
  flag passed: `c8run start` rejects anything it does not define and exits
  immediately, so the list is kept to what `./c8run --help` documents. Its
  output is captured to `.c8run/c8run.log`, which the readiness error points at
  — a cluster that failed to boot is otherwise indistinguishable from a slow
  one. The distribution bundles its own JRE (`jre/`), so no JDK is required. It
  extracts to the repo root rather than a temp directory, so a local run pays
  the ~900 MB download and extraction once instead of per invocation.
  Extraction goes through `tar`, which reads the Linux tarball and the macOS and
  Windows zips alike — on Windows the system's own `tar.exe` (bsdtar), by
  absolute path, since the shell there is Git Bash and its `/usr/bin/tar` is GNU
  tar, which cannot read a zip.
* __`c8run:stop` stops only a cluster `c8run:start` started__ — including one
  whose boot failed, since that still leaves a process behind. Your own cluster
  survives.
* The resolved engine version is printed on start, so a failure can be traced to
  the build it happened on.

### The pinned version

`C8RUN_VERSION` in `harness/c8run.js` is the download center's rolling
minor-line shorthand (`8.10`), so __the engine can change without a commit
here__ — which is deliberate: it gives early warning when an engine build breaks
the deployment path. It currently tracks a pre-release line, so some red builds
will be the engine's fault rather than the modeler's. Pin an exact patch (e.g.
`8.9.19`, with the version repeated in the file name) to make runs fully
reproducible instead.

Because that URL is mutable, a local `.c8run/` can go stale without anything in
the repo changing. `install()` records the artifact's ETag (the stored object's
MD5) in `.c8run/.etag` and re-installs when it changes — the distribution
extracts to a directory stamped with the resolved version, so "already
extracted" is not the same question as "up to date". A pre-existing install with
no recorded ETag is adopted rather than forcing a re-download.

An archive already sitting in `.c8run/` is hashed against that ETag before it is
reused. It is named after the rolling line rather than the resolved version, so
a stale or half-finished download sits at exactly the path a run would pick up —
and reusing it would then record the current ETag over the wrong bytes, after
which every later run would accept them.

Which directory is current is recorded in `.c8run/.install` rather than
inferred: extraction preserves the archive's timestamps, so a directory's mtime
says when the distribution was built, not when it was unpacked. Faced with two
of them and no record, `install()` says so and extracts again from a clean slate
instead of running an arbitrary engine version. Each run logs whether it reused
an install, reused a download, or fetched a new one.

CI caches the download so a runner does not fetch ~900 MB every time, keyed on
the same content hash rather than on the version — `c8run.js etag` resolves it.
Only the archive is cached, never the extracted distribution: Camunda 8 Run keeps
its database inside it (`camunda-data/h2db.mv.db`), so caching that would restore
one run's deployed resources into every later run. Extraction takes seconds; a
pristine cluster is worth more. On a cache hit the run logs `using the already
downloaded …`, so the job output says whether the archive came from the cache.

### Connections

The engine specs launch with `connectToEngine: true`, which does __not__ seed a
connection. It only omits `lastUsedConnection` from the profile: the app then
migrates in its own `c8run (local)` connection and resolves it through
`getDefaultEndpoint()` — the path a user gets out of the box. Without the option
the profile is seeded with `NO_CONNECTION`, which
`Deployment#getConnectionForTab` returns immediately without falling back,
making deployment impossible.

## Layout

```
harness/       ElectronApp launcher, fixtures (test.js), menu,
               the dialog seam, file + path + svg helpers, c8run lifecycle
pages/         page objects (intent, not selectors)
fixtures/      input diagrams
__snapshots__/ golden export baselines (expected outputs)
specs/         the tests
specs/engine/  the opt-in engine suite (needs a cluster)
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

The engine suite runs as a separate __`e2e-engine-tests`__ job, on the same
Linux (Xvfb) / macOS / Windows matrix as the `base` suite. The deployment path
itself is REST over localhost, but getting a cluster there is not: the archive,
the extractor that unpacks it and the way the process is spawned and stopped all
differ per OS, so each one is worth a run.
