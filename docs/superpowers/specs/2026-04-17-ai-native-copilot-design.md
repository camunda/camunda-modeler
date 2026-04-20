# AI-Native Copilot — Marionetted Prototype

**Date:** 2026-04-17
**Author:** Balazs Hajdu
**Status:** Design approved, ready for implementation plan
**Target branch:** `prototype/ai-native-copilot` (branched off `prototype/guided-start-experience`)
**Target release context:** 8.10 discovery (AI-Native Builder Experience initiative)

---

## Context

The existing `prototype/guided-start-experience` branch demonstrates the **AI-off baseline** of the AINBE vision: a two-card empty-canvas overlay, a guided start-event wizard, a redesigned context pad with a distinctive "+" that opens an outcome-framed append wizard, auto-selection of placed elements, and vertical centering of the context pad for large shapes. It addresses the Zapier/Make-refugee persona and the enterprise reality where AI tooling is locked down — the modeler has to be great *without* AI.

What it does not demonstrate is the **AI-on layer**: what happens when a user has AI tooling enabled, how Camunda actually helps build agentic-and-deterministic processes, and how AI teaches "the Camunda way" (not just shapes, but how properties are configured).

This prototype adds that layer as a second milestone on top of the baseline.

### Framing

**AI-Native Builder Experience** is *not* synonymous with "AI inside every input field." The umbrella covers:

1. Reducing friction via **UX / IA / vocabulary** (the existing baseline prototype — legitimate AI-Native work even without any LLM)
2. **AI-authored processes** — the "Camunda starter pack" vision where AI drafts a diagram and the user observes, tweaks, tests, deploys
3. **AI-inside-the-process** — agent-node authoring studio (Branch 1; *deferred* to a separate prototype milestone)

This prototype delivers #2, layered on top of #1. Some customers have no AI tooling enabled at all; they get the baseline experience. Others do; they get the baseline *plus* a targeted AI layer in exactly three places.

### The three AI-on surfaces — each with a named target persona

1. **Copilot pane (empty-canvas only)** — *primary persona: Zapier / Make refugee, BA with no BPMN experience.* The "Build with AI" card on the empty-canvas overlay opens the existing `AiPanel` (currently a static stub). The pane becomes interactive: prompt input + suggestion chips → progressive preview generation inside the pane → "Use this" commits the diagram to the main canvas.
2. **✨ FEEL expression assist** — *primary persona: pro-code developer stuck on FEEL syntax, BA attempting a simple condition.* A ✨ button next to FEEL expression fields (properties panel) that reveals a pre-canned suggestion for the demo scenario.
3. **✨ Task tester incident assist** — *primary persona: everyone — incidents are a cross-persona pain point.* A ✨ "Explain / suggest fix" action on incidents in the task tester that reveals a pre-canned diagnosis + proposed correction.

Everything is **marionetted**. No LLM calls, no Anthropic API. Canned scenarios, scripted animations, pre-designed diagrams. The prototype demonstrates the *user experience*, not the AI capability. Demo is pixel-reproducible.

**What AI-native primitive is actually being prototyped?** Not "can Claude generate BPMN" — that's solved elsewhere. This prototype is a **shape study of the narration + action-log + preview-to-commit interaction pattern**: what does it feel like when AI generation is transparent, navigable, and consent-based rather than opaque? The chips and canned XML are scaffolding; the interaction pattern is the deliverable.

---

## Design Summary

### Interaction model

The "Build with AI" card is the single entry point. Clicking it:
- Closes the properties `SidePanel` (existing `openAiPanel` behaviour)
- Opens the `AiPanel` on the right as a standalone 272px-wide surface (existing)
- The pane shows: header ("✦ AI assistance", close button), intro ("What would you like to do?"), prompt input, 2–3 suggestion chips, and below that an empty preview area and empty action log

User interaction:
1. User clicks a chip → the chip's prompt text auto-fills the input
2. User presses Enter (or clicks a "Generate" button) → scripted animation begins
3. **Mini bpmn-js preview** inside the copilot pane renders elements one at a time with ~500ms stagger
4. **Narration strip** inside the pane types out character-by-character as each element appears
5. **Action log** below the preview accumulates structured entries: `{ elementId, field?, rationale }` per step
6. When the scripted sequence ends, the pane shows "Use this" (primary) and "Regenerate" (secondary) actions
7. **"Use this"** → the preview XML is imported into the main canvas via `modeler.importXML`, copilot closes, properties `SidePanel` reopens, canvas is fitted to viewport
8. **"Regenerate"** → the preview clears, chips reappear, user can pick again
9. **Action log entries are navigate-only post-accept.** Clicking an entry on the main canvas (copilot closed, properties panel open): selects the matching canvas element via `selection.select()`, switches the right `SidePanel` to the `properties` tab, and scrolls the properties panel to the referenced field. During generation (preview mode), log entries are non-interactive display.

### Non-empty canvas behaviour

If the user opens the "Build with AI" entry point on a non-empty canvas (e.g., by re-opening the AI panel after having manually placed elements), the pane shows a friendly locked state: "AI draft mode is only available on a fresh canvas. Start from a new file to use this." No generate action is shown. This names the limitation rather than hiding it.

### ✨ FEEL assist

On any FEEL expression field in the properties panel, a small ✨ button appears inline with the field's label (right-aligned). Click → a small popover appears with a pre-canned suggestion for that field in the demo scenario, plus "Insert" and "Close" actions. "Insert" writes the suggestion into the field via the existing properties-panel value update.

For the prototype, only fields that appear in the canned demo scenarios show a ✨ button (detected by field ID and element ID match against a lookup table). All other FEEL fields render normally with no ✨ — this prevents the prototype from pretending to handle fields it doesn't know about.

### ✨ Incident assist

In the task tester side-panel tab (`test`), when an incident is displayed for the canned demo scenario, a ✨ "Explain this incident" action appears next to the incident message. Click → reveals a pre-written plain-English diagnosis and a suggested fix. The suggested fix is a read-only explanation; it does not modify the diagram automatically.

### AI-off graceful degrade

A single capability flag, resolved from modeler config, gates the three AI-on surfaces:

- `config.aiCopilotEnabled === true` → "Build with AI" card is rendered on the empty-canvas overlay; ✨ buttons render in their respective surfaces
- `config.aiCopilotEnabled !== true` → the empty-canvas overlay shows only the "How does your process start?" card (no two-card layout); no ✨ buttons render; `AiPanel` is never mounted

The flag's default for the prototype is `true` so the demo shows the full experience. Toggling it via the config file demonstrates the AI-off experience for stakeholders who want to see the enterprise-restricted mode.

### Generation scope (what Claude "produces")

Each canned scenario produces: **linear flow + one exclusive gateway with two rejoining branches**. No parallel gateways, no timer events, no call activities, no connector templates, no agent nodes. Demo scenarios cover:

1. **Order approval** — `Message Start (order received) → User Task (manager reviews) → Exclusive Gateway (approved?) → [yes: Service Task (notify customer) → Service Task (fulfill) → End] / [no: Service Task (notify rejection) → End]`
2. **Weekly reminder** — `Timer Start (weekly) → Service Task (generate report) → Exclusive Gateway (has issues?) → [yes: Service Task (send alert) → End] / [no: Service Task (archive) → End]`

Two scenarios is the prototype commitment; a third can be added if scenario 2 reveals no new infrastructure cost. Each scenario is a single JSON file; adding a scenario is adding a file.

### Data model (scenario JSON)

Each scenario lives in `client/src/app/tabs/bpmn/copilotScenarios/<id>.json` with the shape:

```json
{
  "id": "order-approval",
  "chip": {
    "label": "Order approval with manager review",
    "prompt": "When an order comes in, a manager reviews it. Approved orders get fulfilled and the customer is notified. Rejected orders get a notification too."
  },
  "steps": [
    {
      "type": "element",
      "elementId": "StartEvent_order",
      "bpmnType": "bpmn:StartEvent",
      "eventDefinition": "bpmn:MessageEventDefinition",
      "position": { "x": 180, "y": 240 },
      "name": "Order received",
      "properties": { "messageName": "order.received" },
      "narration": "Placing a Message Start Event — the process triggers when an order arrives.",
      "rationale": "Message Start chosen because the prompt mentions 'when an order comes in' — an external event",
      "targetField": "properties-panel.message.name",
      "durationMs": 800
    }
    // ... further steps for task, gateway, branches, end events, and sequence flows
  ],
  "resultXml": "<?xml version=\"1.0\" ...>"
}
```

- `steps` drives the scripted animation — each step is either an `element` placement, a `sequenceFlow` connection, or a `narration`-only beat
- `resultXml` is the pre-laid-out final BPMN XML that's imported into the main canvas on "Use this" (avoids relying on autolayout of the progressively-built preview)
- `rationale` feeds the action log entry
- `targetField` enables click-to-navigate post-accept

### Layout & placement

- Copilot pane: unchanged position (existing `AiPanel`, right side, standalone, 272px)
- Mini preview: inside the pane, ~240×300px, a lightweight `BpmnModeler` or `NavigatedViewer` instance rendering the scenario as it's built
- Action log: below the preview, scrollable, max height ~180px
- Narration strip: between preview and input, single-line ticker that updates with each step
- Input + chips: at the bottom of the pane

### Selection/panel choreography on commit

When "Use this" is clicked:
1. `modeler.importXML(scenario.resultXml)` into the main canvas
2. `canvas.zoom('fit-viewport', 'auto')`
3. `setState({ aiPanelOpen: false })` — copilot closes
4. `handleLayoutChange` with `sidePanel.open: true, tab: 'properties'` — properties reopens
5. Select the scenario's Start Event (always the first step) via `selection.select(startEventShape)` — consistent with the existing `selection.changed` → auto-open-properties behaviour; the properties panel will land focused on the Start Event's properties
6. Display a subtle toast: "Draft applied — click action log entries to navigate"

Action log persists as an in-memory structure on the editor while the pane is closed; it's stored on `this.state.copilotLog` so clicking log entries post-close still works. Log is cleared on canvas clear / file change / next copilot run.

---

## Critical Files

| File | Role |
|---|---|
| **`client/src/app/tabs/bpmn/AiPanel.js`** | **EDIT.** Replace the current static 4-option stub with the interactive copilot (input + chips + preview + narration + log + Use this / Regenerate). |
| **`client/src/app/tabs/bpmn/CopilotPreview.js`** | **NEW.** Mini bpmn-js instance for the in-pane preview. Exposes an imperative API: `placeElement(step)`, `drawFlow(from, to)`, `reset()`, `getXml()`. |
| **`client/src/app/tabs/bpmn/CopilotPlayer.js`** | **NEW.** Marionette player. Given a scenario JSON, drives the scripted sequence: calls `CopilotPreview` methods, advances narration, pushes action-log entries, resolves when the sequence ends. Supports `stop()` mid-sequence. |
| **`client/src/app/tabs/bpmn/CopilotActionLog.js`** | **NEW.** Action log view. Renders entries with element icon + rationale. Handles click-to-navigate callback. |
| **`client/src/app/tabs/bpmn/copilotScenarios/order-approval.json`** | **NEW.** Canned scenario: order approval with gateway. |
| **`client/src/app/tabs/bpmn/copilotScenarios/weekly-reminder.json`** | **NEW.** Canned scenario: timer-triggered weekly reminder. |
| **`client/src/app/tabs/bpmn/copilotScenarios/index.js`** | **NEW.** Scenario registry — exports the array of scenarios loaded by `AiPanel`. |
| **`client/src/app/tabs/bpmn/FeelSuggest.js`** | **NEW.** ✨ popover component for FEEL fields. Accepts `fieldId`, looks up the matching canned suggestion, renders popover with Insert / Close. |
| **`client/src/app/tabs/bpmn/feelSuggestions.js`** | **NEW.** Lookup table of `{ scenarioId, elementId, fieldId } → suggestion` for ✨ FEEL assist. |
| **`client/src/app/tabs/bpmn/IncidentExplain.js`** | **NEW.** ✨ action and reveal UI for task-tester incidents. |
| **`client/src/app/tabs/bpmn/incidentExplanations.js`** | **NEW.** Lookup table of `{ scenarioId, incidentSignature } → explanation`. |
| **`client/src/app/tabs/bpmn/GuidedStart.less`** | **EDIT.** Styles for the interactive copilot (input, chips, preview container, narration strip, action log, action buttons), ✨ buttons, FEEL popover, incident reveal. |
| **`client/src/app/tabs/cloud-bpmn/BpmnEditor.js`** | **EDIT.** `aiCopilotEnabled` capability flag gating; `handleCopilotAccept(xml, log)` — imports XML to main canvas, closes copilot, reopens properties, selects first element, stores log in state; `handleCopilotLogClick(entry)` — selects canvas element + focuses properties field; pass scenarios list + log state into `AiPanel`. |
| **`client/src/app/tabs/bpmn/EmptyCanvasOverlay.js`** | **EDIT.** Hide the "Build with AI" card when `aiCopilotEnabled !== true`. |
| **Task tester side panel integration point** | **EDIT.** Wire `IncidentExplain` into the existing task-testing tab's incident display. Exact integration file identified during planning by reading `client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/`. |
| **Properties panel FEEL field integration point** | **EDIT.** Render the ✨ button next to FEEL expression fields when a canned suggestion exists, via the `bpmn-js-properties-panel` extension API (custom entry or group extension). **DOM-overlay observation of rendered fields is explicitly rejected** — it reproduces the unsanctioned third-party-DOM manipulation pattern that the baseline retrospective flagged as debt. If the extension API cannot support the ✨ button, the feature is dropped rather than worked around. |

### Reused as-is

- `EmptyCanvasOverlay` two-card layout and the `onOpenAiPanel` callback wiring (already exists)
- `openAiPanel` and its side-panel-closing behaviour in `BpmnEditor.js`
- `aiPanelOpen` state management
- `SIDE_PANEL_DEFAULT_LAYOUT`, `handleLayoutChange`, `selection.select()` patterns
- All guided-append work from the baseline prototype (context pad, vertical centering, selection auto-open, start-event wizard)

---

## Implementation Notes

### Mini preview rendering

The in-pane preview uses a **`NavigatedViewer`** (not a full `BpmnModeler`) with progressive XML re-imports. Why: mounting a second full modeler inside a 272px panel is expensive (dozens of diagram-js services, element-template loading, keyboard bindings that conflict with the main modeler). `NavigatedViewer` is ~1/3 the cost and is designed for read-only display.

For progressive appearance, `CopilotPlayer` maintains a cumulative "partial XML" string. Each step appends the next element (and its incoming sequence flow) to the partial XML; `CopilotPreview.showXml(partialXml)` re-imports. The viewer autolayouts by relying on pre-computed `position` values baked into the scenario steps — no live layout algorithm.

Preview zoom is `fit-viewport` after each step so the entire in-progress diagram stays visible.

On commit, `scenario.resultXml` (pre-laid-out, hand-authored once per scenario) is imported into the main canvas. We never export from the preview viewer.

**Scenario authorship:** `resultXml` and step `position` coordinates are hand-authored once per scenario by opening the final target diagram in the modeler, exporting XML, and recording coordinates. This is a one-time authoring cost per scenario, not a runtime cost. A short README in `copilotScenarios/` documents this workflow so scenarios can be added/edited reliably.

### Narration animation

Character-by-character typing in the narration strip: 25ms/char, with `requestAnimationFrame` coalescing. Preemption on scenario reset. Narration is one-line, truncated with ellipsis if overflowing.

**Accessibility:** typing animation is skipped — and the full narration rendered at once — when `prefers-reduced-motion: reduce` is set. The narration element is `aria-live="polite"` and announces each step's full text once (not character-by-character) so screen readers read coherent sentences rather than per-character chatter.

**Rationale authoring:** the `rationale` text in action log entries is the primary AI-shaped moment in the demo. It must read as genuine reasoning, not templated scaffolding ("because the prompt mentioned X" is thin; "because human approval is implied by 'manager reviews it' and User Task is the BPMN primitive for human work" is substantive). Treat rationale strings as UX copy requiring craft, not filler.

### Action log

Each entry renders as `{ elementIcon, elementName, rationale }`. Icons reused from `bpmn-font` (same `bpmn-icon-*` classes used in context pad). During generation, entries are display-only; post-accept, each entry becomes a button calling `handleCopilotLogClick(entry)`.

### Regenerate

Calls `CopilotPlayer.stop()` (if running), `CopilotPreview.reset()` (clears the bpmn-js model), and re-shows chips. Does not commit anything to the main canvas. On second chip pick, sequence plays again.

### Error surface (prototype)

Prototype uses only canned scenarios, so no runtime errors. However, defensive coding: if `scenario.resultXml` fails to import on commit, show a toast "Could not apply draft — try again" and reopen copilot. In practice this only happens if a scenario JSON is malformed during development.

A minimal JSON-schema check on each scenario at load time catches obvious authoring bugs (missing `id`, missing `resultXml`, step without `elementId`) and logs a console warning listing the offending scenario.

### Undo behaviour after commit

`modeler.importXML` replaces the entire model. The modeler's undo stack is cleared on import, consistent with other import paths (e.g., opening a file). After commit, Cmd+Z does *not* undo the "Use this" action; it does nothing (empty undo stack). This matches user expectations for "load a file" semantics and avoids surprising partial-rollback behaviour.

### Log state and tab scope

`copilotLog` state lives on the `BpmnEditor` instance, so it is per-tab. Switching tabs preserves each tab's log. Closing a file discards the log with the tab. Opening a new file in the same tab clears the log.

### Capability flag plumbing

Resolved via the existing modeler config mechanism. Exact config key and conventions are confirmed during the planning phase by reading how similar feature flags are wired in the current modeler (e.g., the Zeebe/Camunda 8 enablement flags). Flag is passed down to `BpmnEditor` via props. `EmptyCanvasOverlay`, `AiPanel` mount point, and ✨ button render sites all branch on this flag. Default during the prototype demo period: `true`.

### Branch strategy

- New branch `prototype/ai-native-copilot` off `prototype/guided-start-experience`
- Commits on the new branch only touch files listed above
- No changes to the `prototype/guided-start-experience` branch during this prototype
- Merge path: neither branch merges to `main`; both are demo branches. `prototype/ai-native-copilot` layers *visually* on top of the baseline for stakeholder demos.

---

## Deferred (explicitly out of scope)

- Real Claude API integration
- Agent-node / ad-hoc subprocess authoring studio (Branch 1 of AINBE)
- Copilot on non-empty canvas
- Connector template selection inside generated diagrams
- Parallel gateways, timer intermediate events, call activities in the generation scope
- ✨ assists outside FEEL fields and incident displays
- Real incident data in task tester (scripted incidents only)
- Progressive disclosure in properties panel
- Hub/Catalog integration (deferred from baseline)
- Form Hub browsing
- Accessibility audit — must happen before any customer-facing release, not before prototype demo

---

## Demo script (end-to-end stakeholder flow)

Three surfaces stitched into a single story:

1. **Open the modeler → empty canvas.** Two-card overlay visible.
2. **Click "Build with AI" → copilot opens.** Properties panel closes. Show the chips. Read one aloud.
3. **Click the "Order approval" chip → press Enter.** Preview animates element-by-element over ~8 seconds. Narration strip types rationale. Action log fills up.
4. **Click "Use this" → diagram commits.** Copilot closes. Properties panel reopens focused on the Start Event. Toast "Draft applied."
5. **Click the action log entry for "User Task 'Manager reviews order'" → canvas selects the task, properties panel focuses its assignee field.**
6. **In the assignee field (a FEEL expression), click ✨ → popover with `${order.salesRep}` and rationale → click Insert.** Demonstrates AI assist at the hardest modeling moment.
7. **Switch to Test tab → run scenario → scripted incident appears ("Variable `order.salesRep` not found").**
8. **Click ✨ "Explain this incident" → plain-English diagnosis + suggested fix.** Demonstrates AI assist at the second-hardest moment.
9. **Close copilot context by clicking back to the diagram** — user keeps modeling with guided-append (baseline, AI-off).

Total demo length: 3–4 minutes. Story arc: AI drafts → you navigate → AI unblocks on FEEL → AI unblocks on incident → AI gets out of the way.

## Success metrics (measurable if we instrument)

Not automated in the prototype, but stated so we know what "working" looks like beyond "clicks around correctly":

| Metric | How to judge | Target for "this prototype is worth pursuing" |
|---|---|---|
| Time to first deployable-looking diagram | Stopwatch on stakeholder trying the demo themselves | Under 60 seconds from empty canvas |
| Number of manual edits after "Use this" | Count edits in the first 5 minutes post-accept | ≤ 3 edits on the happy-path scenario |
| Navigation success rate from action log | Can the user find a specific property field via the log? | ≥ 80% success on a blind task |
| "Did you understand what the AI did?" | Qualitative — ask after demo | ≥ 3/5 stakeholders say yes without prompting |
| Rationale quality perception | Show two versions (templated vs crafted) side-by-side | Crafted wins for ≥ 4/5 |

Telemetry instrumentation is deferred; metrics above are for manual stakeholder-session measurement.

## Verification

1. **Baseline untouched.** All baseline verification from `prototype/guided-start-experience` continues to pass: empty-canvas two-card overlay, start-event wizard, guided "+" context pad, vertical centering, selection auto-open-panel.

2. **AI-off mode.** With `aiCopilotEnabled = false`, the empty-canvas overlay shows only one card ("How does your process start?"). No "Build with AI" card. No ✨ buttons on FEEL fields. No ✨ on incident displays. Opening `AiPanel` is impossible from the UI.

3. **AI-on mode — copilot open.** With `aiCopilotEnabled = true`, empty canvas → two-card overlay → click "Build with AI" → `AiPanel` opens on the right, properties `SidePanel` closes. Pane shows input + chips + empty preview + empty action log.

4. **Chip → generate.** Click the "Order approval" chip → prompt auto-fills → press Enter → preview animates: Start Event appears, then User Task, then Gateway, then branches, then End Events, then sequence flows. Narration strip updates. Action log accumulates entries. Sequence completes in under 10 seconds.

5. **Regenerate.** Click Regenerate → preview clears, chips reappear, action log clears. Pick different chip → different scenario plays.

6. **Use this → commit.** After a scenario completes, click "Use this" → main canvas imports the scenario XML, copilot closes, properties panel reopens, the Start Event is selected, properties panel focuses the Start Event's fields. Toast confirms "Draft applied."

7. **Log navigation post-accept.** After commit, click any action log entry on the (still-visible) log → matching canvas element is selected and highlighted; properties panel focuses the referenced field. Works across multiple log entries.

8. **Non-empty canvas lockout.** Manually place an element, then re-open copilot → pane shows locked state message, no generate action.

9. **FEEL ✨.** Select an element from a committed scenario that has a FEEL field covered by a canned suggestion → ✨ button visible next to the field → click → popover with suggestion → Insert → field value updates in the model and XML.

10. **Incident ✨.** In task tester with the demo scenario, trigger the canned incident → ✨ "Explain this incident" visible → click → reveals diagnosis + fix suggestion inline.

11. **Scenario count.** At minimum two scenarios (`order-approval`, `weekly-reminder`) available as chips. Each produces a different diagram.

12. **Keyboard.** Escape in copilot during generation halts and returns to chips. Escape in FEEL popover closes it. Enter in the prompt input triggers generate (same as pressing the button).

13. **Demo reproducibility.** Running the same scenario twice produces identical diagrams with identical narration timing (within animation jitter). No randomness anywhere.

14. **JSON schema check.** Each scenario in `copilotScenarios/` conforms to the documented schema. A smoke test (manual or scripted) loads every scenario and verifies `{ id, chip.label, chip.prompt, steps[], resultXml }` are present and non-empty.

15. **XML round-trip check.** Each scenario's `resultXml` imports cleanly into a fresh `BpmnModeler` without validation warnings. Verified once per scenario during authoring.

16. **Action log navigation coverage.** For each scenario, every log entry's `targetField` lands on an actual properties-panel field when clicked. Verified once per scenario.

17. **Reduced-motion path.** With `prefers-reduced-motion: reduce`, narration appears fully on each step rather than typing char-by-char; preview elements appear immediately rather than with stagger.

## Open questions and blind spots

Items the planning phase must resolve or accept:

- **Scenario authorship tooling.** No tooling exists to author `resultXml` + step coordinates — it's hand-labour per scenario. Acceptable for two scenarios; painful if the prototype expands. Documented in a `copilotScenarios/README.md` during implementation.
- **Properties panel extension API limits.** If `bpmn-js-properties-panel` cannot host a ✨ button alongside FEEL entries through its public extension API, the FEEL ✨ feature is dropped rather than implemented via DOM manipulation. Decision made in planning, not implementation.
- **Incident injection point.** Real incidents in the task tester come from live Zeebe execution. For the demo, incidents must be injected. Integration point (mocked Zeebe response? fixture file? a "demo mode" flag in the task tester?) is resolved in planning after reading `side-panel/tabs/task-testing/`.
- **Undo across the `importXML` boundary.** Spec commits to "undo stack clears on commit" behaviour. If the baseline already preserves undo across `importXML` (unlikely but possible), that is honoured; if it doesn't, we do not add new undo behaviour.
- **Persona contradiction in the demo.** The demo script shows a Zapier-refugee persona using all three surfaces. In practice a single user is unlikely to need both the copilot draft *and* FEEL + incident assists — those are later-in-the-lifecycle moments. The demo compresses a multi-session arc into one sitting for narrative coherence; this is an acknowledged demo artifice, not a user-research claim.
- **"Coming soon" surfaces elsewhere in the UI.** The baseline deferred "From Catalog" as a stub; this spec does not add any similar stubs. If review pressure emerges to add "AI agent node" or "Hub integration" cards as placeholders, resist — they reproduce the locked-door pattern.
