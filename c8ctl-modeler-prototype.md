# Desktop Modeler on top of `c8ctl` — prototype

Aleksey Manetov, 2026-11-04 · Spike [internal-docs#1381](https://github.com/bpmn-io/internal-docs/issues/1381), sketch [c8ctl#641](https://github.com/camunda/c8ctl/pull/641)

Throw-away prototype on branch `c8ctl-integration` (camunda-modeler, one local `spike:` commit, not pushed). All results below were checked in the running app unless marked "not verified".

---

## 1. Why

Desktop Modeler re-implements what `c8ctl` does: connections, deploy, start instance, a local cluster hint. Every feature is built twice, and the two drift apart. The idea of the spike: **`c8ctl` owns connections and runtime calls, Desktop Modeler is a UI on top of it.** The sketch ([c8ctl#641](https://github.com/camunda/c8ctl/pull/641)) is a draft proposal, not yet reviewed or agreed with the c8ctl team.

The prototype answers three questions:

1. How can Desktop Modeler run `c8ctl` at all?
2. How much of today's Modeler can go through `c8ctl` **without changes to `c8ctl`**?
3. What does `c8ctl` need so we can go further? → **[Findings](#6-findings--what-is-not-possible-today-and-why)**, the main result

## 2. Approach

```
Renderer (unchanged UI)                Main process                         c8ctl (child process)
  status bar, deploy, start  ──IPC──►   existing zeebe:* handlers  ──spawn──►  c8ctl <cmd> --profile <p> --json
                                         ├─ has a profile → c8ctl              reads profiles / Modeler settings.json
                                         └─ otherwise     → SDK (as today)     calls the cluster
```

- **c8ctl is bundled** as an npm dependency (`@camunda8/cli`) and runs on **Electron's own Node** (`ELECTRON_RUN_AS_NODE`). No global install and no PATH needed.
- **One process per call**, JSON on stdout / stderr. About 200 ms per call.
- **Existing IPC handlers forward to c8ctl.** The renderer barely changes, so a later switch to a long-running c8ctl touches only main.
- **The Modeler sends only a profile name, never secrets.** c8ctl reads credentials itself:
  - Modeler connections as `modeler:<id>` from the Modeler `settings.json` (this already works in c8ctl today, see below);
  - c8ctl's own profiles from its `profiles.json`.

**How Modeler connections reach c8ctl (an existing c8ctl feature, not built by us):**
1. The Modeler stores its connections in `settings.json` under `connectionManagerPlugin.c8connections`, including secrets, as plain JSON.
2. c8ctl already reads this file on **every call**: `loadModelerConnections()` in c8ctl `core/config.ts`, from the default Modeler data folder. Every Modeler connection becomes a read-only profile `modeler:<name>`; c8ctl also accepts the connection id.
3. c8ctl maps the Modeler fields to its own profile fields: SaaS (cluster URL, client ID and secret, OAuth URL with the SaaS default), Self-Managed without auth, with basic auth, and with OAuth (client ID and secret, OAuth URL, audience, scope), plus the tenant.
4. The prototype adds two things:
   - it addresses connections by **id** (`modeler:<id>`), so duplicate or renamed names do not matter;
   - it sets `C8CTL_MODELER_DIR` to the Modeler's real user-data folder, so c8ctl also finds the connections when the Modeler runs with a custom `--user-data-dir`.

What this gives:
- Existing users keep their connections; there is nothing to migrate.
- A connection saved in Settings is used by c8ctl on the next call.
- The terminal and AI agents see the same connections.

Limits:
- **Read-only:** c8ctl cannot edit or remove these connections.
- **Only saved connections:** the settings dialog still checks unsaved drafts through the Modeler SDK.
- **gRPC fails:** c8ctl is REST only.
- **Modeler-only fields are ignored:** Operate URL, Tasklist URL, and the custom certificate flag.
- **Tested only with no-auth connections** (`c8run (local)`). The SaaS, basic-auth and OAuth mappings were read in the source, not run.
- **It is a contract:** renaming the settings key or changing the connection shape breaks c8ctl. This is already listed as a public contract in our rules.

## 3. Alternatives we looked at

**How to run c8ctl**

| Option | Result | Verdict |
|---|---|---|
| User's global `c8ctl` | Expected not to be found when the app starts from Finder or the Dock. macOS gives GUI apps the launchd PATH (`/usr/bin:/bin:/usr/sbin:/sbin`) and does not read `.zshrc`, where nvm and Homebrew add their paths. This is known macOS behavior and the reason why VS Code resolves the shell environment at startup. Tested only as a simulation with `env -i`. A login-shell lookup works but costs about 1.5 s. Unknown version | Only for optional hints |
| **Bundled `c8ctl` on Electron's Node** | Works without PATH, also in the packaged app (see 5). Pinned version. Adds about 17 MB to `app.asar` | **Used in the prototype** |
| Long-running c8ctl process (one per Modeler, talks over STDIO) | Does not exist. The sketch proposes `c8ctl mcp` (c8ctl's own commands as MCP tools); a plain JSON-RPC mode would work as well. Only a draft proposal, nothing implemented | What we ideally need; the adapter interface stays the same |
| `c8ctl mcp-proxy` → cluster MCP server | Exists today. Long-running, auth from the c8ctl profile. Calls take about 27 ms instead of about 200 ms. Structured results and structured errors (`status`, `title`). But only the cluster's 18 tools: **no deploy**, no FEEL, no cluster variables, no secrets, no start instructions, no profiles, no local cluster | Shows the long-running model works. Not a replacement for c8ctl's own commands |
| Import `c8ctl` as a library | Not possible today: internal API, needs CLI start-up, different SDK major version. **Planned in the sketch since 2026-11-04** ("Core libraries": a runtime-free `lib` layer with subpath exports) | Rejected today; revisit when the libraries exist |

**How to cover calls c8ctl cannot make yet**

| Option | Verdict |
|---|---|
| One c8ctl command per Modeler operation | **Preferred.** Real reuse; agents get the same tools |
| c8ctl as a token broker, Modeler keeps its SDK code | Only a temporary bridge. Moves connection ownership, but features stay duplicated |
| Generic REST passthrough (`c8ctl api …`) | Possible, but no gRPC and not useful for agents |

## 4. Result

**Integrating c8ctl into Desktop Modeler works, and it is cheap on the Modeler side.** The limits we found are in c8ctl's feature set and contract, not in the integration model.

- **c8ctl can be shipped and run by the Modeler.** It is bundled as an npm dependency and runs on Electron's own Node. No global install, no PATH, no extra runtime. **Verified in a packaged macOS app:** c8ctl runs directly from inside `app.asar`, and it adds about 17 MB.
- **It fits the existing architecture.** The existing `zeebe:*` IPC handlers in main forward to c8ctl, so the renderer barely changes. The change is about 750 lines: one adapter module plus small changes to main, the preload and the connection plugin.
- **The Modeler needs no secrets for the calls that go through c8ctl.** It sends a profile name; c8ctl reads the credentials. Existing Modeler connections work without migration: c8ctl already reads them, read-only, from the Modeler's `settings.json` on every call (see section 2).
- **Real features run on it today:** connection check, deploy, start instance, and a new local cluster start / stop (details in section 5).
- **One process per call works for single actions, not for polling.** Deploy or start instance at about 200 ms is fine. A status check every 5 s means about 16 processes per minute, each up to 120 MB. A product needs a long-running c8ctl: through `c8ctl mcp-proxy` a call took 13–27 ms, and only a long-running process can send live updates and progress. The adapter is built so that this switch touches only main.
- **To go further we need c8ctl, not more Modeler work:** a safe embedding contract (strict `--profile`, error codes, results on stdout), a profile API, and the missing commands. See [Findings](#6-findings--what-is-not-possible-today-and-why).

**Our position:** build on c8ctl incrementally. Start where the Modeler has nothing to lose (the local cluster), and move existing features once c8ctl closes the contract gaps.

## 5. What works through c8ctl today

| Feature | c8ctl command | Notes |
|---|---|---|
| c8ctl profiles in the connection selector | `list profiles` | Read-only group "(from c8ctl)" |
| Connection check (status bar) | `get topology` | For Modeler connections and c8ctl profiles |
| Deploy | `deploy <file>` | Existing notification and Operate link work |
| Start instance | `create pi` | Variables via stdin, never in argv |
| Local cluster status / start / stop | `cluster status / start / stop` | New in the Modeler: "Local Camunda 8.10 is running." + Start / Stop |

Measured: `get topology` 170–360 ms, `deploy` 180–340 ms, `create pi` about 180 ms, `cluster stop` 0.9 s, `cluster start` 29 s to about 2 min.

**Packaged app (macOS arm64, unsigned):** built with `electron-builder --mac dir` and started with `open` from a terminal. Check, deploy, start instance and the local cluster status all work. c8ctl runs from inside `app.asar` with the app binary as Node (`Camunda Modeler …/app.asar/node_modules/@camunda8/cli/dist/index.js`), and no asar unpacking is needed. Timings are the same as in dev (166–217 ms). electron-builder keeps both SDK versions: c8ctl's v10 at the top level, and the Modeler SDK's 8.8.4 nested under it. c8ctl-only packages add about 17 MB to the 355 MB `app.asar`.

Note: `open` from a terminal passes the terminal's environment, including its PATH (verified), so this run is **not** the same as a Finder start. This does not matter for the bundled approach, because it starts c8ctl by absolute path with the app's own binary and never looks at PATH. A real Finder start was not tested; it would use the real Modeler settings. `cluster start` should also work from Finder, because C8 Run 8.10.6 ships its own `jre` (inferred).

Still possible without c8ctl changes, not built: FEEL playground (`feel` plugin), "Save connection to c8ctl" (`add profile --from-env`), Operate link for the local cluster.

## 6. Findings — what is not possible today, and why

This is the main result of the prototype. Ordered by impact. Checked against c8ctl 4.6.1 unless marked otherwise.

### Critical — blocks the goal

**1. The Modeler cannot manage connections only in c8ctl.**

c8ctl stores the full profile in its own `profiles.json`: URL, auth type, client ID, secrets, tenant. But it does not **give** this data back:
- `list profiles` returns only name, URL and tenant;
- there is no `get profile`;
- there is no `update` or `rename`; `add` with an existing name silently replaces the whole profile;
- there is no stable id, and no way to check a draft connection before saving.

So the Modeler cannot show a c8ctl profile in its settings form (auth type, client ID, OAuth URL), cannot edit it, and cannot check it. It can only **use** a profile by name. For this reason the prototype keeps the Modeler connection store and shows c8ctl profiles read-only next to it. Hiding secrets is right; the gap is the missing **non-secret** details and the missing write API.

How it could work:
- c8ctl returns the non-secret fields and a stable id (`get profile`), never the secrets;
- c8ctl accepts secrets only through stdin or env (`add` / `update`), not argv;
- c8ctl checks a draft connection (`check profile` with credentials from stdin);
- then the Modeler migrates its connections into c8ctl once and drops its own store.

**2. Without secrets, every Modeler call must go through c8ctl — and many cannot yet.**

Once c8ctl owns the profiles, the Modeler has no credentials. Of the Modeler's 18 cluster calls:
- **4 run through c8ctl in the prototype:** check, gateway version, deploy, start instance;
- **7 could:** 6 searches / authorizations and FEEL evaluate. They are not worth it yet, because the features that use them are blocked;
- **7 cannot:** 2 searches, cluster variables (4 calls), connector secrets.

This blocks two features:
- **Task testing:** `create pi` also has no start / runtime instructions;
- **Credential manager:** cluster variables and connector secrets.

With a c8ctl-only profile, these features do not work at all.

**3. An unknown profile silently falls back to `local`.**

`--profile does-not-exist` succeeds against the local cluster (verified). A deploy can go to the **wrong cluster**. The prototype checks that the profile exists before every call (+170 ms). This must be fixed in c8ctl before any real use.

**4. No error codes, and results partly on stderr.**

Errors are English text (`fetch failed`, `INVALID_ARGUMENT` + multi-line engine text). Some results exist only on stderr: the deployment key and the process instance key; `create pi` writes nothing to stdout. The Modeler matches text and parses stderr lines, so any rewording in c8ctl breaks Modeler messages and form hints.

**5. One process per call does not scale to polling.**

Every c8ctl call starts a full Node runtime. Measured per call: about 0.2 s, 0.18 s CPU and **about 120 MB peak memory**. The Modeler polls:
- the connection status of the active C8 tab every 5 s;
- plus the profile check for G1 (finding 3).

That is about 16 processes per minute for as long as a C8 tab is open: roughly 3 s of CPU per minute, with 120 MB spikes (inferred from the per-call numbers). Today the same check is one HTTP request inside the running app. Task testing polls even more. Acceptable for a prototype, **not for a product**. This needs a long-running c8ctl process (e.g. `c8ctl mcp` as proposed in the sketch). Through `c8ctl mcp-proxy`, a call took 13–27 ms in an already running process.

### Important — limits the user experience

**6. No live updates and no progress.**

Profiles added in the terminal show up only after a reload. `cluster start` (29 s to 2 min) gives no progress. Both also need a long-running c8ctl that can send notifications.

**7. No gRPC and no custom certificates.**

c8ctl is REST only; gRPC connections fail. It has no OS certificate store and no custom CA, so connections behind TLS-inspecting proxies may break (not tested).

**8. No login and no token cache.**

There is no `login` command, and every call fetches a new OAuth token. Login (#3814) cannot be built on c8ctl yet.

**9. Terminal state leaks in.**

`c8ctl use tenant` overrides the profile's tenant even with `--profile` (read in source, not run). Profiles are also shared with the terminal and agents: an agent can remove a profile that a Modeler tab uses.

### Minor / our side

- **Bundling:** about 17 MB more in `app.asar`. Modeler releases become tied to c8ctl releases, so a version check is needed.
- **Depends on Electron's `RunAsNode` fuse:** it is on today (not configured in the Modeler). If the team ever turns it off for hardening, the spawn breaks. Electron's `utilityProcess` API would avoid this (not tested).
- **Not tested:** a signed and notarized build, Windows and Linux.
- **Two connection lists:** the same cluster can appear twice, e.g. `c8run (local)` and `local`.
- **No Operate link for c8ctl profiles:** a profile has no field for the Operate URL.

Camunda 7 is not affected; it stays in the Modeler.

## 7. Solution ideas

A brief overview of directions for the big problems. Not agreed with the c8ctl team.

- **Make c8ctl safe to embed.** Add an "embedded mode" to c8ctl:
  - strict `--profile`;
  - error codes;
  - all results on stdout;
  - fast failures;
  - no terminal state and no update checks.

  Small, and it helps agents and scripts too.
- **Close the feature gaps by adding commands to c8ctl.** Start / runtime instructions, cluster variables, secrets and the missing searches. This is real reuse. Until then, these features stay on the SDK.
- **Move to a long-running c8ctl process** instead of one process per call, for example `c8ctl mcp` as proposed in the sketch. It removes the cost per call and enables live profile updates and cluster-start progress.
- **Import c8ctl core libraries for the fast, simple parts.** Proposed in the sketch since 2026-11-04: read profiles, build an authenticated client, resolve a project's deploy set, look up element templates, all in-process with typed errors. The long-running process stays for long-running work (cluster start, login, watch). This would also solve the polling cost: the status check becomes an in-process HTTP call again. Minor concern, **bundle size**: the Modeler would ship c8ctl's client (`@camunda8/orchestration-cluster-api` v10, about 24 MB in `app.asar`) next to its own `@camunda8/sdk` (about 10 MB, with its own older copy of the same client), until the Modeler drops its SDK. If the libraries live in the CLI package, the MCP SDK and its server dependencies come along too, unless c8ctl ships them as separate packages. Not critical.
- **Let c8ctl own the connections.** A profile API that returns non-secret details with a stable id and takes secrets only through stdin or env. It also needs update, rename and a draft check. Then migrate the Modeler connections into c8ctl once (see finding 1).
- **Decide gRPC and login at product level.** Either c8ctl adds gRPC, or the Modeler drops it. Login goes through c8ctl or through the shared TS client library.
- **Ship a pinned c8ctl with the Modeler,** with a version check.

## 8. Recommendation

1. **c8ctl team: a small "embedding contract" epic.**
   - Strict `--profile`.
   - Error-code catalog.
   - All results on stdout.
   - Fast failures.
   - An embedded mode without terminal state and update checks.

   This also helps agents and scripts.
2. **Modeler, in parallel: the local cluster through c8ctl** (status, start, stop). It is new for the Modeler, so nothing regresses, and it fits the new start page. Then deploy and start instance, as shown here.
3. **Later: connections owned by c8ctl, and task testing.** These need the profile API, instructions, missing commands and notifications, ideally through a long-running c8ctl process.

## 9. Decisions for the team

- **Bundle c8ctl** in the Modeler (size, release coupling, version handshake)?
- **gRPC:** drop it in the Modeler, or ask c8ctl to support it?
- **Login (#3814):** through c8ctl, or through the shared TS client library?
- **Order:** start with the local cluster, as proposed?

## 10. Try it

```sh
cd camunda-modeler                 # branch c8ctl-integration
npm ci                             # installs the bundled c8ctl
c8ctl cluster start                # optional: a local cluster
c8ctl add profile demo --baseUrl http://localhost:8080/v2
npm run dev
```

Open a Camunda 8 BPMN file. Click the connection name in the status bar, pick "demo (from c8ctl)", then deploy or start an instance. Details and the full gap list with IDs are in the knowledge base file `c8-first-onboarding.md`, §6.3a (not part of this repository).
