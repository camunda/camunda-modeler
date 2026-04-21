# Validate Mode — Design Spec

**Branch lineage (prototype series):**
```
main
  └── prototype/guided-start-experience      (EmptyCanvasOverlay, StartEventDialog, Guided Append)
        └── prototype/ai-native-copilot      (AiPanel + CopilotStepper + scripted scenarios)
              └── prototype/left-rail-revamp (ModeRail + CommandPalette + mode-scoped chrome)
                    └── prototype/validate-mode  ← THIS SPEC
```

Target: Camunda 8 only (`client/src/app/tabs/cloud-bpmn/`).

---

## Problem

The left-rail prototype introduced a **Test mode** placeholder that routes to the existing Task Testing side-panel tab. That tab already works: it wraps `@camunda/task-testing`, deploys to Zeebe 8.8+, starts a process at a chosen element with supplied inputs, and reports pass/fail/incident.

What's missing — and what a designer actually reaches for — is *the reflex you have when drawing a task*:
> "Does this one thing do what I expect?"

Today that reflex costs 4 interactions: switch to Test tab, find the element in a dropdown, type inputs from memory, hit run. The canvas (where you were thinking) carries no memory of what you just validated.

The goal of **Validate mode** is to collapse that reflex into one interaction: **click the element, see what it needs, run it, keep the result on the canvas**. Element by element, the canvas becomes a confidence map.

This is explicitly **not Play** — the forthcoming Web Modeler test studio that will cover full process execution with token flow. Validate mode is **per-element**, **no process-state semantics**, **unit-test-grained**.

---

## Design Summary

| Piece | Decision |
|---|---|
| Mode rename | "Test" → "Validate" in **UI strings only**. `modeConfig` key stays `test` (no codebase churn). Affects: rail chip label, canvas chip copy, hotkey tooltip, side-panel tab title. |
| Interaction model | **Selection = target.** Clicking an element on canvas (in Validate mode) retargets the side-panel Validate tab to that element. No auto-walk, no cursor state machine. Reuses `eventBus.on('selection.changed')`. |
| Side-panel tab | **Existing Task Testing tab, renamed to "Validate."** Becomes the canonical surface for inputs, run, results. Augmented with one new card + element-type-aware Run button. No new inspector component. |
| Required-inputs card | Small card at the top of the Validate tab, populated by `modeler.get('variableResolver').getVariablesForElement(element, { read: true })`. Lists variables the element *consumes*. Advisory only — the existing input editor below it stays authoritative. Hidden if the element consumes nothing. |
| Runnability policy | Per-element-type lookup table: runnable (Run enabled), not-runnable (Run disabled + inline explanation), conditionally-runnable (Run enabled + pre-run advisory). Centralized in `runnability.js` so the rule is one place. |
| Canvas badges | After each run, attach a ✓ / ✕ / ⚠ overlay to the element's canvas shape via `modeler.get('overlays')`. Session-only `Map<elementId, runState>`. Re-running overwrites. "Clear all results" link in the canvas chip resets. |
| Engine | Real `@camunda/task-testing` — **no mocks**. Requires deployed-to-Zeebe 8.8+ as today. Connection banner behavior in the tab is unchanged. |
| Memory persistence | Session-only. Cleared on tab reload, file close, or "Clear all results." Not written to `.bpmn`. |

**Principle accounting:**
- **#2 Less is more** — no new inspector UI; reuse the tab that already works. One new card, one overlay layer.
- **#3 Know the context** — clicking an element *is* the intent. Selection is already the cheapest, most-used gesture in the modeler.
- **#5 No surprises** — non-runnable elements don't silently do nothing; they show a disabled Run with a one-line explanation.
- **#6 Empower the user** — the variable resolver already knows what inputs are required; surface it so the user doesn't have to remember or guess.

---

## Interaction Flows

### Primary flow: validate a service task

1. User is in Validate mode (rail chip clicked, or Cmd+4).
2. User clicks a **Stripe-connector service task** on the canvas.
3. Side panel (already open in Validate mode) retargets the Validate tab to this task.
4. **Required inputs card** appears at the top of the tab, listing `amount`, `currency`, `customer_id` — the consumed variables the resolver computed.
5. User fills sample values in the tab's existing input editor. (The required-inputs card just tells them *what* to fill; the existing form is *where* to fill.)
6. User clicks **Run** (enabled — service tasks are runnable).
7. Task Testing engine deploys (if not yet), starts a process at this element with the supplied inputs, kills after.
8. Result comes back via the engine's existing `taskTesting.finished` event.
9. **Validate mode attaches an overlay** to this element: ✓ on success, ✕ on failure, ⚠ on incident.
10. Canvas now shows: this task with a green ✓, nothing on the others.
11. User clicks another task. Tab retargets. Previous task's badge remains.

### Edge flow: clicking a gateway

1. User clicks an exclusive gateway.
2. Tab retargets.
3. Required-inputs card shows any condition variables (from the resolver's read set).
4. **Run button is disabled** with inline text: *"Gateways route, they don't execute — validate the task on either side."*
5. Variable inspector still shows what flows through, because knowing that is useful on its own.

### Edge flow: clicking a user task

1. Tab retargets.
2. Required-inputs card populated.
3. Run button **enabled**, but a pre-run advisory renders above it: *"User tasks require manual claim & complete in Tasklist — this run will hang until someone picks it up."*
4. User proceeds at their own risk. Engine handles the hang; existing cancel / reason-dispatch logic applies.

### Edge flow: clicking an agentic subprocess

1. Tab retargets.
2. Required-inputs card populated.
3. Run button **enabled**, with advisory: *"Agentic subprocess validation is best-effort in Camunda 8.9. Treat results as indicative."*

### Edge flow: "Clear all results"

1. User clicks "Clear all results" in the canvas chip.
2. All overlay badges detach.
3. Session map empties.
4. Any currently-selected element still targets the tab as before (selection-sync is independent of memory).

---

## Runnability Policy

A single table drives element-type behavior. Centralized in `runnability.js` so the rule lives one place.

| Element (BPMN `type`) | Run | Advisory / Explanation |
|---|---|---|
| `bpmn:ServiceTask` | ✅ enabled | — |
| `bpmn:BusinessRuleTask` | ✅ enabled | — |
| `bpmn:ScriptTask` | ✅ enabled | (legacy — rare in C8) |
| `bpmn:CallActivity` | ✅ enabled | "Called process must also be deployed." (shown only if called process isn't) |
| `bpmn:SubProcess` | ✅ enabled | — |
| `bpmn:StartEvent` *(plain, no event definition)* | ✅ enabled | — |
| `bpmn:UserTask` | ⚠ enabled w/ advisory | "User tasks require manual claim & complete in Tasklist — this run will hang until someone picks it up." |
| Agentic subprocess *(marker-detected; C8.9)* | ⚠ enabled w/ advisory | "Agentic subprocess validation is best-effort in Camunda 8.9. Treat results as indicative." |
| `bpmn:ExclusiveGateway`, `ParallelGateway`, `EventBasedGateway` | ❌ disabled | "Gateways route, they don't execute — validate the task on either side." |
| `bpmn:BoundaryEvent` | ❌ disabled | "Boundary events attach to a task — validate the parent task instead." |
| `bpmn:EndEvent` | ❌ disabled | "End events terminate the process — nothing to run." |
| `bpmn:IntermediateCatchEvent` | ❌ disabled | "Catch events wait for an external signal — not directly runnable from here." |
| `bpmn:IntermediateThrowEvent` | ❌ disabled | "Throw events emit a signal — the preceding task is what you want to validate." |
| `bpmn:StartEvent` *(message / timer / signal)* | ❌ disabled | "This start event requires an external trigger. Use a plain start or a downstream task." |
| `bpmn:TextAnnotation`, `bpmn:DataObjectReference`, `bpmn:Participant`, etc. | ❌ disabled | "This element isn't executable." |

**Agentic subprocess detection**: one helper `isAgenticSubprocess(element)` encapsulates the rule so callers don't branch. The rule, in order of preference:
1. If `businessObject.get('zeebe:adHocSubProcess')` is truthy (expected 8.9 moddle attribute), treat as agentic.
2. Otherwise, fall back to a name heuristic: element name matching `/\bagent(ic)?\b/i`. This is a prototype-grade heuristic so we don't block on moddle-spec finalization; the advisory copy is conservative ("best-effort") so a false positive is harmless.
3. If the moddle attribute lands with a different name before implementation, swap it in #1 — single-file change.

**Why a central table:** it becomes the one place the PM, designer, and engineer agree on copy. Renaming or relaxing any row is a one-line change. Tests can iterate the table.

---

## Canvas Badges — the one piece of new UI

Visual: small rounded pill attached to the top-right of each element's canvas shape.

| Status | Glyph | Background | Border |
|---|---|---|---|
| pass | ✓ | `#ecfdf5` | `#10b981` |
| fail | ✕ | `#fef2f2` | `#ef4444` |
| incident | ⚠ | `#fff7ed` | `#f59e0b` |

Rendered via `modeler.get('overlays').add(elementId, { position, html })`. One overlay per element. Re-running overwrites by removing the old overlay first. `Map<elementId, overlayRef>` kept in the badge manager so we can clear all on command.

Badges persist across:
- Mode switches (stay visible when the user leaves Validate, come back on return).
- Selection changes (obviously).
- Canvas pan / zoom (overlays are native bpmn-js — free).

Badges cleared on:
- Tab reload / file close (session-only).
- "Clear all results" link.
- Undo of an edit that deletes the element (overlays service handles orphans).

---

## Critical Files

### New

| File | Purpose |
|---|---|
| `client/src/app/tabs/cloud-bpmn/validate/useValidateSelectionSync.js` | React hook. When `mode === 'test'`, subscribes to `eventBus.on('selection.changed')` and emits the selected element to BpmnEditor's state so the Validate tab can consume it. No-op in other modes. |
| `client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.js` | Small class (30–50 lines). Listens for `taskTesting.finished` events from the tab; translates result → status; calls `overlays.add` / `overlays.remove` keyed by elementId. Exposes `clearAll()` and `getStatus(elementId)`. Session-scoped. |
| `client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.js` | React card rendered above the existing input editor in the Validate tab. Calls `variableResolver.getVariablesForElement(element, { read: true, written: false })`. Renders one row per consumed variable (name + inferred type if available). Hidden if no reads. |
| `client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.less` | Card styling — matches the existing tab's card idiom. |
| `client/src/app/tabs/cloud-bpmn/validate/runnability.js` | Pure module: `isRunnable(element) → { enabled: boolean, advisory: string \| null, explanation: string \| null }`. Implements the table above. Unit-testable in isolation. |
| `client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.less` | Overlay pill styling (three colored variants). |

### Modified

| File | Change |
|---|---|
| `client/src/app/tabs/cloud-bpmn/rail/RailModesSection.js` | Chip label "Test" → "Validate". No structural change. |
| `client/src/app/tabs/cloud-bpmn/mode/modeConfig.js` | `test.canvasChip.label` → "Validate mode". `test.canvasChip.hint` → "Click an element to review it; runnable ones show Run." Internal mode key stays `test`. The "Clear all results" link is **not** added via modeConfig — CanvasChip accepts an optional action prop that BpmnEditor wires to `validateBadges.clearAll()` when in Validate mode. Keeps modeConfig declarative (no callbacks in config). |
| `client/src/app/tabs/cloud-bpmn/rail/RailTooltip.js` or wherever tooltip copy lives | Rename "Test (Cmd+4)" → "Validate (Cmd+4)". |
| `client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js` | (a) Accept a `selectedElement` prop. When it changes, retarget internal element state. (b) Render `<RequiredInputsCard element={selectedElement} modeler={modeler} />` above the existing form. (c) Consult `runnability.js` — disable Run + show explanation for non-runnable, show advisory for conditionally-runnable. (d) Reuse the existing `taskTesting.finished` event (already emitted — see `TaskTestingTab.js` lines 141–164 from the exploration report) as the signal `ValidateBadges` listens on. No new event name; just ensure the event payload includes the element id and a derived `{ status: 'pass' \| 'fail' \| 'incident' }` keyed off `success` + `reason`. |
| `client/src/app/side-panel/SidePanel.js` (or wherever tab labels live) | Rename the visible tab title "Task Testing" → "Validate". |
| `client/src/app/tabs/cloud-bpmn/BpmnEditor.js` | (a) Instantiate `useValidateSelectionSync(modeler, mode)` so canvas clicks flow into the selected-element state. (b) Instantiate a single `ValidateBadges` per modeler, teardown on tab close. (c) Pass `selectedElement` prop into the Task Testing/Validate tab render call. |
| `client/src/app/tabs/cloud-bpmn/CanvasChip.js` (or equivalent) | If the chip copy includes a "Clear all results" link when in Validate mode, it calls `ValidateBadges.clearAll()`. |

### Reused as-is

- `@bpmn-io/variable-resolver` — already available via `modeler.get('variableResolver')`. No registration.
- `@camunda/task-testing` + `TaskTestingApi.js` — unchanged. Validate mode is a UI shell, not an engine change.
- `bpmn-js` overlays service — free.
- Connection status banners, deployment handling, version gates — unchanged; they live in the tab.

---

## What's Deferred (YAGNI)

- **Persistent canvas memory** across reloads. Session-only in v1.
- **Automated walking / cursor-based stepping** — explicitly out; that's Play's territory.
- **Trigger simulation** — no "fire timer" / "send message" affordances. Validate doesn't simulate.
- **Pre-flight schema validation** — engine is execution-only; we don't reimplement it.
- **Per-turn agentic subprocess trace** — if user clicks it, full subprocess runs as one black box. Turn-by-turn view is a future iteration.
- **Cross-element scenario chains** ("run A then B with A's output as B's input") — future.
- **Variable-type-aware input widgets** — we rely on the existing tab's input editor; no new form controls.
- **Migration of the internal `test` mode key to `validate`** — UI string rename only.
- **i18n** — strings inline in English for the prototype.
- **Multi-modeler coordination** — one Validate session per modeler instance; no cross-tab awareness.

---

## Verification

1. **Rename coverage.** Open a C8 file → rail chip reads "Validate". Hover rail chip → tooltip reads "Validate (Cmd+4)". Click chip → canvas chip reads "Validate mode — click an element…". Open side panel → tab label reads "Validate". No user-visible string says "Test mode" in this prototype.
2. **Selection sync, basic.** Enter Validate mode → Validate tab shows "Select an element on the canvas." Click a service task → tab targets it immediately (≤1 frame visual lag).
3. **Required-inputs card populates.** Click an element with declared input mappings → card lists them by name (and type if known). Click an element with no reads → card hidden, no empty-state clutter.
4. **Run a runnable task end-to-end.** Connection green + file deployed → fill sample inputs in the existing editor → click Run → real engine deploys + runs + reports result. On success, a green ✓ badge appears on the element's canvas shape within ~3 seconds (polling latency).
5. **Badge persistence across selection.** Run task A → ✓ badge. Click task B → tab retargets, A's badge stays. Click A again → tab retargets back, badge unchanged.
6. **Run on failure.** Run a connector with bad inputs → ✕ badge on canvas. Run again with good inputs → ✕ replaced by ✓ (single overlay per element).
7. **Gateway click.** Click an exclusive gateway → tab retargets; Run button disabled; inline explanation reads "Gateways route, they don't execute — validate the task on either side." Required-inputs card still shows variables if any.
8. **User task advisory.** Click a user task → Run enabled; banner above Run reads "User tasks require manual claim & complete in Tasklist — this run will hang until someone picks it up."
9. **Agentic subprocess advisory.** Click an agentic subprocess (8.9 file) → Run enabled; advisory shown. Detection heuristic confirmed manually.
10. **Call activity click.** Click a call activity → Run enabled. If called process isn't deployed, advisory "Called process must also be deployed" appears; Run still enabled (engine will error clearly if not).
11. **End event click.** Click an end event → Run disabled; explanation reads "End events terminate the process — nothing to run."
12. **Clear all results.** Run 3 different elements → 3 badges visible. Click "Clear all results" in the canvas chip → all 3 badges gone; session map empty. Immediately click an element → tab still targets it (sync is independent of memory).
13. **Session-only persistence.** Run 2 elements → close the tab and reopen → all badges gone. Run 2 elements → switch to Design mode and back → badges still there. Run → save file → badges still there; save does not persist them.
14. **Undo of deletion.** Badge on element X → delete element X → badge gone (overlays service handles). Undo → element back, no badge (expected — we don't resurrect memory).
15. **Connection loss.** Disconnect from Zeebe → Run disabled by the existing connection banner (unchanged behavior); badge system untouched.
16. **Pre-existing regressions.**
    - Rail + modes + command palette unchanged.
    - Side-panel tab switching still works for Properties / Variables / Validate / Task Testing.
    - Properties-group CSS filter per mode unchanged.
    - Guided Append unchanged.
    - EmptyCanvasOverlay unchanged.
    - AiPanel + CopilotStepper unchanged.

---

## Open Questions resolved during brainstorming

- **Mock vs. real engine?** Real. The task tester works; reuse is the whole point.
- **Rename depth?** UI strings only. `modeConfig.test` key stays.
- **Side-panel tab title?** "Validate."
- **Non-runnable elements?** Read-only view with disabled Run + one-line inline explanation. Honest, no dead end.
- **Runnable set?** Not just tasks — also call activities, subprocesses, agentic subprocesses, and plain start events.
- **Canvas memory scope?** Session-only.
- **Trigger simulation?** Not in scope. Validate validates tasks, not processes.

---

## What Makes This Worth Building

A designer who's just drawn a new service task with a Stripe connector should be able to:
1. Click the task.
2. Glance at what inputs it needs (resolver card).
3. Fill two fields.
4. Run it.
5. See a green badge on canvas.
6. Click the next task.
7. Glance, fill, run, green.

After 10 minutes, the canvas shows 7 green badges and 1 red on a misconfigured connector. They know exactly what works, exactly what doesn't, and they did it without leaving the canvas. That's the "continuous modeling" principle made concrete.

**Play will do the rest** — end-to-end process runs with token flow, scenario libraries, regression — when Web Modeler's test studio ships. Validate mode is the desktop-grained complement: one element, one confidence check, no process-state ceremony.
