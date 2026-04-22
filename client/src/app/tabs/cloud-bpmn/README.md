# Cloud BPMN Editor — Prototype Notes

Camunda 8 BPMN editor (`tabs/cloud-bpmn/`) carrying three stacked prototypes. Camunda 7 lives in `tabs/bpmn/` — if you're here to change C8 behavior, this is the right folder.

## What's in this folder

```
cloud-bpmn/
├── BpmnEditor.js           Class component; owns the modeler, rail state, badges lifecycle
├── BpmnTab.js              Thin wrapper BpmnEditor mounts inside
├── diagram.bpmn            Empty-file template
├── applyConfig.js          Per-file feature flag application
├── command-palette/        CMD+E overlay — fuzzy search over shapes/templates/actions/modes/copilot
├── mode/                   Mode controller + config table (design / implement / simulate / validate)
├── modeler/                bpmn-js module bundle (features like guided-append)
├── rail/                   Left rail — tools, mode-filtered shapes, flyouts, search, mode chips
├── side-panel/             Right side-panel tab registry + tab implementations
├── validate/               Validate-mode chrome (this prototype)
└── variables-side-panel/   Shared variable-outline component wiring
```

## Prototype lineage

This branch stacks three prototypes. Each one is additive — nothing was rewritten.

```
main
 └── prototype/guided-start-experience        EmptyCanvasOverlay + Start Event wizard + Guided Append
      └── prototype/ai-native-copilot         AiPanel chat shell + CopilotStepper + scripted scenarios
           └── prototype/left-rail-revamp    ← you are here
                 ├── Mode rail (tools / shapes / search / modes)
                 ├── Figma-style shape flyouts + confident active states
                 └── Validate mode (per-element validator — see validate/)
```

The four user-facing modes in this branch:

| Mode | Intent |
|---|---|
| Design | BA outlining a process. Minimal rail, narrow properties panel, Guided Append is the primary growth verb. |
| Implement | Developer wiring a connector. Full rail with flyouts, all properties, Variables panel. |
| Simulate | Honest placeholder. "Token simulation coming soon" overlay, no fake animation. |
| Validate | Per-element runnability — "will this element execute with these inputs?" via `@camunda/task-testing`. |

UI says "Validate"; the internal mode key is still `'test'` to avoid codebase churn across branches.

## How to run

```bash
# From repo root
npm install
npm run dev
```

This starts the Electron app in dev mode with hot reload. Open any `.bpmn` file or create a new Camunda 8 diagram.

Keyboard: `CMD+E` (macOS) / `CTRL+E` (Windows/Linux) anywhere outside a text input opens the command palette.

## Design principles in force

This prototype tries to hold the line on a few things. If your change breaks one, please say so in the PR description — we may still take it, but we want to make the tradeoff deliberately.

- **Editors, not drawing tools.** Domain semantics win. Validate mode doesn't pretend a gateway is runnable — it explains why.
- **Less is more.** The rail has 7 primaries in Implement mode, not 15. Flyouts carry the variants.
- **No surprises.** Every affordance says what it will do before you commit. "Run" disabled with an explanation beats "Run" silently failing.
- **Prototype-honest.** When something isn't wired up (Simulate token animation), we say so instead of faking it.

## Conventions

- **Styling.** LESS with CSS Modules (`import * as css from './Foo.less'`, use `css.className`). Global classes (bpmn-js overlays, djs-*) are imported without `:local` — see `validate/ValidateBadges.less` for the pattern.
- **bpmn-js access.** Always go through the injector/modeler: `modeler.get('overlays')`, `injector.get('selection')`, etc. Wrap optional services in try/catch (see `useCurrentSelection.js`) — some services aren't registered in every modeler configuration.
- **Lifecycle.** React components manage their own subscriptions (`useEffect` cleanup). Class-owned services (see `ValidateBadges`) implement `destroy()` and are torn down in `componentWillUnmount`.
- **Events between React and the app shell.** Use `onAction('emit-event', { type, payload })` → routed via `EventsContext`. Don't bolt on a second event bus.
- **Mode state.** Single source of truth is `modeController` inside `BpmnEditor.js`; functional children consume via the `useMode(controller)` hook in `mode/modeController.js`.

## Validate mode architecture

If you're contributing to Validate specifically:

```
validate/
├── runnability.js            Decision table. Start here to change what's runnable.
├── useCurrentSelection.js    Hook — returns first-selected element from bpmn-js.
├── RequiredInputsCard.{js,less}   Read-variables list (variable-resolver).
├── ValidatePanel.{js,less}   Orchestrator mounted above <TaskTesting>. Exports
│                             composeOnTestTask() which layers runnability check
│                             on top of the existing connection guard.
└── ValidateBadges.{js,less}  Session-only overlay manager. One pass/fail/incident
                              badge per element; bpmn-js overlays service.
```

Event flow when a validation runs:

```
<TaskTesting> emits onTaskExecutionFinished
   → TaskTestingTab bubbles via onAction('emit-event', { type: 'taskTesting.finished', payload })
      → BpmnEditor intercepts, calls this._validateBadges.record(payload)
         → overlay added at { top: -10, right: 8 } with glyph ✓/✕/⚠
```

Badge state is a `Map<elementId, overlayId>` living inside `ValidateBadges`. It is **session-only**: destroyed on tab unmount, never serialized. `shape.remove` listener drops stale entries so undo+redelete doesn't resurrect ghosts.

## Not covered by tests yet

This is a prototype; there's no automated coverage on the three new prototypes. If you're adding tests, start with the Validate-mode units — they're the most recent work and have the crispest contracts:

1. `runnability.js` — pure function. Table-driven test per `$type` row, including `StartEvent` with/without `eventDefinitions`, the `SubProcess` + agentic name/moddle fork, and the `default` fallthrough. Decision tables drift silently; tests lock the contract.
2. `composeOnTestTask()` — the guard composition. Assert short-circuit order: connection gate first → runnability gate → "no selection → defer to library." Easy to regress by reordering.
3. `ValidateBadges.record()` — replace-then-add semantics. Recording twice on the same element should leave exactly one overlay; `clearAll()` zeroes the map AND calls `overlays.remove` for each id.
4. `ValidateBadges` `shape.remove` cleanup — delete an element that had a badge, re-add via undo, record again: no stale map entry, no orphan overlay.
5. `useCurrentSelection` — hook mounted after a selection exists returns it on first render; unmount removes the `selection.changed` listener.

Beyond Validate, obvious follow-ups: command-palette fuzzy scorer (`scoreCommand()` in `commandIndex.js`) and mode-switch side effects in `BpmnEditor.js` (side-panel tab routing / canvas-chip lifecycle when switching modes with an element selected).

## Contributing

File-scoped changes are easier to review. If you touch the rail, keep the PR to `rail/`; if you touch Validate, keep it to `validate/` and the two integration points in `TaskTestingTab.js` + `BpmnEditor.js`.

Each prototype has a spec and a plan under `docs/superpowers/`. Start there before changing shared chrome — the spec tells you which tradeoffs were intentional.

For questions: `#modeling-team` on Slack, or ping Balazs (PM) / Nico (Domain Lead).
