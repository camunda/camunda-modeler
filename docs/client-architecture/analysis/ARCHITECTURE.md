# Client Architecture Analysis

> Analysis date: 2026-06-18

## Overview

The client (`client/src`) is a React application embedded in an Electron shell. It lets users open and edit BPMN, DMN, Form, XML, JSON, and RPA files in a tabbed editor, and connects to Camunda/Zeebe for deployment and start-instance operations.

**Scope:** ~501 JS/JSX files, ~108K lines of code (excluding `node_modules`).

### Top-level structure

```
client/src/
├── app/          Core app: shell, tabs, linting, panels, status bar (~60K LOC)
│   ├── tabs/     Editor implementations (8 tab types)
│   ├── plugins/  Plugin infrastructure
│   ├── zeebe/    Shared Zeebe deployment/start-instance utilities
│   └── ...       Hooks, primitives, modals, notifications, …
├── plugins/      Built-in feature plugins (~30K LOC)
├── remote/       IPC bridge to main process (~5K LOC)
├── shared/       Cross-cutting UI components (~5K LOC)
└── util/         Pure utility functions (~3K LOC)
```

---

## Architecture

### Layering model

```
┌──────────────────────────────────┐
│  plugins/  (feature plugins)     │
├──────────────────────────────────┤
│  app/      (shell + editors)     │
├──────────────────────────────────┤
│  remote/   (IPC boundary)        │
├──────────────────────────────────┤
│  Electron main process           │
└──────────────────────────────────┘
```

`shared/` and `util/` cut across all layers. `plugins/` is intended to be loosely coupled to `app/` via the plugin event system, but in practice there are direct import violations (see §4).

### Plugin system

Plugins are React components mounted by `PluginsRoot`. They receive a set of callbacks (`triggerAction`, `getConfig`, `setConfig`) and access to the event system. Plugins can contribute UI via the slot-fill mechanism (`SlotFillRoot` / `SlotFillContext`). This architecture is sound and enables feature isolation.

### Editor (tab) pattern

Each editor type lives in `app/tabs/<type>/` and follows the same shape:

```
<type>/
├── <Type>Editor.js     Main editor component (~1K LOC each)
├── <Type>Tab.js        Thin wrapper (tab registration)
├── modeler/            Instantiates the underlying bpmn-js/dmn-js/… modeler
├── get*ContextMenu.js  Context menu builder
├── get*EditMenu.js     Edit menu builder
└── get*WindowMenu.js   Window menu builder
```

Editors extend `CachedComponent` and are wrapped in `WithCache(WithCachedState(...))` for lifecycle management across tab switches.

---

## Findings

### 1. God Object — `App.js` (2,925 LOC)

`App.js` is a single React class that owns:

- Tab lifecycle (open, activate, close, move, reload)
- File I/O (read, save, export, import dialogs)
- Dirty / unsaved state tracking
- Auto-save with debouncing
- Engine profile and linting state
- Layout persistence
- Plugin event routing via `triggerAction`
- Notification management
- Modal orchestration (keyboard shortcuts, open/close dialogs)
- Workspace session persistence
- Recent-files tracking

It exposes ~30 public methods, most of which are passed down as props to editors and plugins. As a result, any cross-cutting change (e.g., adding a new state dimension, changing save behavior) requires touching this file.

The class is deeply tested in `AppSpec.js` (5,370 LOC) — the test file is already larger than the implementation — but the large test file itself is evidence of how much logic lives here.

**Suggested split:** `TabManager` (open/close/move/state), `FileManager` (read/save/dialogs), `LayoutManager` (layout persistence, workspace), leaving `App` as a thin coordinator.

---

### 2. Duplicated editor lifecycle — no base class

All five active editors (`bpmn`, `cloud-bpmn`, `dmn`, `cloud-dmn`, `form`) extend `CachedComponent` directly and independently re-implement the same lifecycle protocol:

| Method | bpmn | cloud-bpmn | dmn | cloud-dmn | form |
|---|:---:|:---:|:---:|:---:|:---:|
| `handleChanged` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `handleImport` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `handleLinting` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `listen(fn)` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `isDirty()` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `loadTemplates` | ✓ | ✓ | — | — | — |
| `EngineProfileHelper` | ✓ | ✓ | ✓ | ✓ | ✓ |

`EngineProfileHelper` is instantiated independently in all six editors (including `rpa`). Any change to engine-profile handling, linting integration, or the dirty-state protocol must be applied in five places.

The debounce setup is a good illustration — each editor independently calls `debounce(this.handleLinting.bind(this))` in its constructor.

**Suggested fix:** Extract a `BaseEditor extends CachedComponent` that provides `handleChanged`, `handleImport`, `handleLinting`, `listen`, `isDirty`, and `EngineProfileHelper` setup. Individual editors override only what differs.

---

### 3. Near-identical editor pairs (bpmn / cloud-bpmn and dmn / cloud-dmn)

The four diagram editors come in platform/cloud pairs. Structurally they are near-identical but maintain separate implementations.

**bpmn vs. cloud-bpmn (996 / 1,123 LOC):**

`cloud-bpmn` correctly re-uses the menu-generation utilities from the platform variant:

```js
// cloud-bpmn/BpmnEditor.js
import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';
import { getBpmnEditMenu }  from '../bpmn/getBpmnEditMenu';
import getBpmnWindowMenu    from '../bpmn/getBpmnWindowMenu';
```

But the editor class itself is still a full copy. The two files share the same ~17 lifecycle-related method invocations and diverge only in:

- `DEFAULT_ENGINE_PROFILE` constant (`platform` vs. `cloud`)
- `loadTemplates` (platform: `getPlatformTemplates`, cloud: `getCloudTemplates`)
- Cloud extras: variables side panel, task testing tab, `SidePanelGroup`, extra imports

**dmn vs. cloud-dmn (1,117 / 1,150 LOC):**

Despite the fact that `cloud-dmn` is _larger_ than `dmn`, it does not add significantly more unique behavior — it also re-implements the full lifecycle independently. Both files share the same 14 lifecycle hits.

`bpmn-shared/` exists as a shared module but only contains four files (`configure.js`, `applyDefaultTemplates.js` and their tests). The shared surface area is far smaller than the actual overlap.

**Suggested fix:** For each pair, extract a `BpmnEditorBase` / `DmnEditorBase` that contains the ~80% shared logic. Platform and cloud variants override the modeler class, engine profile defaults, and template loading.

---

### 4. Plugin coupling to app internals

Plugins are supposed to communicate with the app exclusively through the event/callback API. Several plugins bypass this and import directly from `app/` internals:

```
plugins/user-journey-statistics/…/VariablesPanelEventHandler.js
  → app/tabs/cloud-bpmn/variables-side-panel/VariablesSidePanel (DEFAULT_OPEN constant)

plugins/settings/useBuiltInSettings.js
  → app/tabs/EngineProfile (getAnnotatedVersion, toSemverMinor)

plugins/process-applications/ProcessApplicationsStartInstanceNotifications.js
  → app/zeebe/util (getStartInstanceUrl)

plugins/process-applications/ProcessApplicationsDeploymentNotifications.js
  → app/zeebe/util (getDeploymentUrls)

plugins/zeebe-plugin/start-instance-plugin/StartInstancePluginOverlay.js
  → app/zeebe/util (multiple)

plugins/zeebe-plugin/deployment-plugin/DeploymentPluginOverlay.js
  → app/zeebe/util (getResourceType)

plugins/zeebe-plugin/deployment-plugin/DeploymentNotifications.js
  → app/zeebe/util (multiple)
```

`app/zeebe/util` is effectively a shared library imported by both `app/` and `plugins/`. Moving it to `shared/` or `util/` would make the dependency explicit and safe. The `EngineProfile` and `VariablesSidePanel` imports are harder to justify — they expose internal implementation details to plugins.

Additionally, several plugins hardcode tab-type strings:

```js
// start-instance-tool
return tab && tab.type === 'bpmn';

// start-instance-plugin
return tab && tab.type === 'cloud-bpmn';

// template-updater
if (activeTab && activeTab.type === 'cloud-bpmn' && hasNew)
```

This creates invisible coupling: renaming a tab type, or splitting a tab type, silently breaks plugin behavior.

**Suggested fix:** Export tab-type constants from a single location (`app/tabs/tabTypes.js` or similar) and import from there. Expose `EngineProfile` utilities and zeebe URL builders through the plugin API or `shared/` rather than letting plugins reach into `app/tabs/`.

---

### 5. `TabsProvider.js` (803 LOC) — registration mixed with detection logic

`TabsProvider` handles tab-type registration, file-extension mapping, icon assignment, and tab creation. Its 800 lines are a consequence of encoding all 8 tab types with their full metadata inline, plus the provider API surface. It is manageable today but will grow with each new tab type.

Tab providers could declare their own metadata (extensions, icons, names) closer to their implementation and register themselves, rather than having all configuration centralized.

---

### 6. `bpmn-shared/` is too small for its role

The `bpmn-shared/` directory exists to share code between the bpmn and cloud-bpmn tabs. It contains only:

```
bpmn-shared/
├── modeler/features/apply-default-templates/   (1 file)
└── util/configure.js
```

The menu-generation utilities (`getBpmnContextMenu`, `getBpmnEditMenu`, `getBpmnWindowMenu`) are in `bpmn/` and imported by `cloud-bpmn` — which works, but makes the directional dependency non-obvious (a "platform" module imported by a "cloud" module). Moving these into `bpmn-shared/` would make the intent clear.

---

## Summary table

| Smell | Location | Severity |
|---|---|:---:|
| God Object | `app/App.js` (2,925 LOC, 30+ methods) | High |
| No base editor class | All 5 editors re-implement same lifecycle | High |
| Near-identical editor pairs | `bpmn`/`cloud-bpmn`, `dmn`/`cloud-dmn` | High |
| Plugins importing app internals | `app/tabs/EngineProfile`, `app/zeebe/util`, `VariablesSidePanel` | Medium |
| Hardcoded tab-type strings in plugins | `tab.type === 'cloud-bpmn'` scattered in 5+ files | Medium |
| `bpmn-shared/` undersized | Menu utilities still live in `bpmn/` | Low |
| `TabsProvider` centralized | All 8 tab types registered in one 800-line file | Low |

---

## What works well

- **`remote/` IPC boundary** is clean: one module per backend service, consistent `backend.send()` pattern.
- **`shared/ui/`** is used correctly across all layers and has no reverse dependencies.
- **`cloud-bpmn` menu reuse** — importing menu builders from `bpmn/` rather than duplicating them is the right pattern; it just isn't applied consistently.
- **Slot-fill mechanism** allows plugins to contribute UI without App knowing about them.
- **`CachedComponent` + `WithCache`** give a consistent answer to "what do I do when a tab is hidden/shown" without ad-hoc lifecycle hacks.
- **`cloud-dmn` importing from `dmn/`** (getDmnEditMenu, getDmnWindowMenu, configure) is the right pattern for variant reuse — the BPMN pair should follow the same model.
