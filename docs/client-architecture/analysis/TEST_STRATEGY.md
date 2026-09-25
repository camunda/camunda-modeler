# Client Test Strategy Analysis

> Analysis date: 2026-06-18

## Overview

The client test suite (~65K LOC across 501 JS files) operates at two distinct levels that are used consistently but unevenly across the codebase:

- **API level** — tests that render React components and then drive them through their _JavaScript API_ (methods, event bus, cached state). The rendered DOM is incidental.
- **UI level** — tests that render components and then interact through the _DOM_, asserting on what the user actually sees and can click.

The split is not accidental: the editor components expose a rich programmatic API (`triggerAction`, `handleChanged`, `getXML`, `getCached`, …) that is the real contract — the DOM is just a canvas. Plugin overlays and form components, conversely, have no meaningful JS API; their contract _is_ what they render.

---

## API Level

### Where it is used

All five active editors (`bpmn`, `cloud-bpmn`, `dmn`, `cloud-dmn`, `form`), `App`, and non-UI classes (`ZeebeAPI`, `ConnectionChecker`, `Deployment`, …).

### Pattern

1. Render the component via a shared `renderEditor(EditorClass, xml, options)` helper.
2. Obtain an `instance` ref.
3. Drive behavior through instance methods or through the modeler event bus.
4. Assert on callback spy calls, state, or return values.

```js
// given
const onChangedSpy = spy();
const { instance } = await renderEditor(diagramXML, { onChanged: onChangedSpy });

// when
modeler._emit('commandStack.changed');

// then
expect(onChangedSpy).to.have.been.calledOnce;
```

The component renders but test assertions never touch the DOM.

### The modeler mock (`test/mocks/bpmn-js/Modeler.js`)

The shared mock is the foundation for all editor API-level tests. It provides:

- A real EventEmitter (`on`, `off`, `_emit`) so tests can fire lifecycle events and observe reactions.
- A real `CommandStack` with undo/redo state, so `isDirty()` / dirty-state logic is testable.
- Stubs for every bpmn-js service (`selection`, `clipboard`, `linting`, `propertiesPanel`, …).
- `importXML` / `saveXML` that use actual `bpmn-moddle` parsing, so XML round-trips produce real BPMN objects.

This design is pragmatic: it lets tests exercise the editor's reaction to modeler events without paying the cost of a real bpmn-js renderer. The key invariant is that the mock honours the _behavioral_ contract (events fire in the right order, commandStack state changes) while stubbing the _visual_ surface.

### The `renderEditor` helper

Located at `app/__tests__/helpers/renderEditor.js`, this shared helper:

- Wraps the editor in `WithCachedState` and a `SlotFillRoot`.
- Provides a full set of default props (config, layout, linting, callbacks).
- Waits for `onImport` before returning, so tests start in a stable post-import state.
- Returns `{ instance, rerender }` — the `rerender` helper re-renders with new props for update testing.

Every editor spec uses this helper, which is good. The downside: it encodes opinionated defaults (e.g. `layout.sidePanel.open: true`) that can silently affect tests if a default changes.

### `AppSpec.js` — API-level shell test

`AppSpec.js` (2,925 LOC implementation → 5,370 LOC test) operates at the App's JS API surface:

```js
const { app } = createApp({ globals: { fileSystem } });
await app.openFiles([ createFile('1.bpmn') ]);
await app.triggerAction('save');
expect(fileSystem.writeFile).to.have.been.calledOnce;
```

The `createApp()` helper constructs the full `App` component with fake globals (Backend, Config, Dialog, FileSystem, ZeebeAPI, …) from `app/__tests__/mocks/index.js` (709 LOC). These fakes implement the same interface as the real remote objects but record calls and return configurable responses.

The App tests are largely integration tests at the JS level: they exercise full workflows (open → edit → save → close) but with all I/O mocked. This is the right level to verify that the orchestration logic in App is correct.

### Pure API tests (no React)

`ZeebeAPI`, `ConnectionChecker`, `Deployment`, `VersionMismatchChecker`, and utility modules (`app/zeebe/util`, `app/tabs/util/*`) are tested with plain unit tests — instantiate the class, call a method, assert on the result or a spy. No React involved.

```js
const zeebeAPI = new ZeebeAPI(backend);
zeebeAPI.checkConnection(endpoint);
expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', { ... });
```

This is the simplest and most robust test type, and the pattern is consistent throughout.

---

## UI Level

### Where it is used

Plugin overlays (`DeploymentPluginOverlay`, `ConnectionManagerSettingsComponent`, `StartInstanceConfigForm`, `SettingsForm`, …), shared UI components (`shared/ui/form/*`, `shared/ui/Overlay`, `Notification`, `Panel`, `StatusBar`, …), and small focused components inside tabs (RPA run/status buttons, VariablesSidePanel, TaskTestingTab).

### Pattern

1. Render the component directly via `@testing-library/react`.
2. Find elements via `getByTestId`, `container.querySelector`, `getByRole`, `getByText`.
3. Trigger interactions with `fireEvent.click`, `fireEvent.change`.
4. Assert on DOM state or callback spies.

```js
// given
const { container } = createComponent({ initialValues: connections });

// then
expect(container.textContent).to.contain('Production Cluster');

// when
fireEvent.click(container.querySelector('.connection-row'));

// then
await waitFor(() => {
  expect(container.querySelector('.connection-details')).to.exist;
});
```

### Observation: inconsistent selector strategies

UI-level tests mix three selector strategies without a clear rule:

| Strategy | Example | Robustness |
|---|---|:---:|
| `getByTestId` / `data-testid` | `getByTestId('connection-manager-settings')` | High |
| `container.querySelector` with CSS class | `querySelector('.empty-placeholder')` | Medium |
| `container.textContent` substring | `textContent.to.contain('No connections configured')` | Low |

The `container.querySelector('.class-name')` pattern couples tests to CSS class names that also drive styling. A CSS refactor can silently break tests. The `data-testid` pattern avoids this; using it consistently for structural selectors would improve test resilience.

### AppSpec UI interactions

`AppSpec.js` is primarily API-level but includes ~44 DOM queries (`queryByText`, `screen.getByText`) to assert on what the app renders after API calls — e.g. checking that a tab label disappears after close. This mixed mode is appropriate for the App since it's both an orchestration unit and the root renderer.

---

## Test Structure: What's Well Covered

### Editor method coverage

The four main editor specs (`BpmnEditorSpec`, `cloud-bpmn/BpmnEditorSpec`, `DmnEditorSpec`, `cloud-dmn/DmnEditorSpec`) each cover the same surface:

| Section | LOC (bpmn) |
|---|---|
| Caching behavior | ~40 |
| Plugin integration | ~130 |
| `#exportAs` | ~40 |
| `#listen` / event wiring | ~60 |
| Linting behavior | ~200 |
| `#handleChanged` state | ~300 |
| Engine profile detection | ~150 |
| Namespace migration (bpmn only) | ~100 |
| Menu generation | ~100 |

Coverage of the editor lifecycle is comprehensive at the API level.

### Service / IPC boundary (`remote/`)

`ZeebeAPISpec.js` (1,410 LOC) tests every combination of `checkConnection`, `deploy`, `run`, and `cancel` for all target types (self-managed, cloud, oauth). Each test verifies the exact IPC message shape sent to the backend. This is the most thorough boundary test in the suite and gives strong confidence in the serialization contract.

---

## Test Structure: Gaps and Smells

### 1. Test duplication mirrors code duplication

Because `bpmn/BpmnEditor` and `cloud-bpmn/BpmnEditor` are near-identical implementations, their test files are also near-identical (2,360 vs. 2,636 LOC, ~83 vs. ~91 `it('should` cases). The same sections appear in both:
- `caching behavior`
- `plugins`
- `#listen`
- `linting`
- `#handleChanged`
- engine profile
- element templates

When a shared behavior is changed (e.g. linting trigger logic), both test files must be updated. This is the test-level symptom of the missing `BaseEditor` class described in `CLIENT_ARCHITECTURE_ANALYSIS.md`.

### 2. `handleChanged` state assertion is fragile

The `#handleChanged` tests assert on a large flat state object (~25 properties at once):

```js
expect(state).to.include({
  align: false, canvasFocused: true, copy: false,
  dirty: true, find: true, handTool: true, ...
});
```

A new state property not listed here will never be tested until someone explicitly adds it. New properties silently expand the real API surface without test coverage. Prefer testing individual behaviors in isolated tests rather than one snapshot-style assertion.

### 3. Integration test is nearly empty

`IntegrationSpec.js` was intended to test cross-editor workflows using the real `TabsProvider` and real editor components. It has 2 tests:
- 1 skipped with a bug reference and no resolution date
- 1 active test (modal rendering)

The skipped test (`should reimport on externally changed file`) is the most realistic cross-component test in the suite. Its skip implies a gap in integration-level confidence: the App + Tab + Modeler interaction for external file changes is untested.

### 4. Pending test stubs

`AppSpec.js` contains 3 empty pending tests:

```js
it('tabsProvider');
it('onReady');
it('should offer save, save-as, export, undo, redo if supported by tab');
```

These are unimplemented tests for known important behaviors. They pass silently.

### 5. Skipped tests with known bugs

Three tests in `DeploymentConfigValidatorSpec.js` are skipped with the comment:
> "The following test cases fail due to broken validation logic."

They have been skipped rather than fixed. This is a known regression that is not covered by the test suite.

### 6. No coverage for `App.js` internal state transitions

`AppSpec.js` tests App behaviors end-to-end (open files, trigger save, check callback) but does not test internal state transitions directly (`app.state.dirtyTabs`, `app.state.tabs` ordering after concurrent operations). Some edge cases (e.g., saving a tab that was closed mid-save) are not covered.

### 7. Selector fragility in UI tests

~835 DOM queries across the suite use class-name selectors (`querySelector('.empty-placeholder')`, `querySelector('.form-group input[type="text"]')`). These bind test correctness to CSS module naming. A significant portion of UI test failures in refactoring scenarios come from renamed CSS classes that carry no semantic meaning.

---

## Summary

| Layer | Primary approach | Tooling | Coverage |
|---|---|---|:---:|
| Pure utilities / services | Unit tests, no React | Chai + Sinon | High |
| IPC boundary (`remote/`) | API-level, mock backend | Chai + Sinon | High |
| Editors (`bpmn`, `dmn`, `form`, …) | API-level, mock modeler + real event bus | `renderEditor` helper + Sinon | High |
| App orchestration | API-level, all globals mocked | `createApp` helper + Sinon | High |
| Plugin overlays / forms | UI-level, React Testing Library | @testing-library/react | Medium |
| Shared UI components | UI-level, React Testing Library | @testing-library/react | Medium |
| Cross-editor integration | Mostly absent (IntegrationSpec skipped) | — | Low |

**The dominant approach is API-level testing of React components.** This is well-suited to the architecture because editors expose a rich, stable JS API that is the real contract between layers. The approach makes tests fast and precise.

The main weaknesses are:
1. Test duplication between editor variants (consequence of missing `BaseEditor`)
2. The fragile `handleChanged` state snapshot tests
3. Near-absent integration coverage
4. CSS class selectors in UI tests
5. Known-broken tests silently skipped rather than fixed
