# Copilot Scenarios

Each scenario is a canned input for the AI Copilot pane. Scenarios are
marionetted — there is no LLM involved.

## Authoring a new scenario

1. Open the modeler and model the target diagram by hand.
2. Save. Open the `.bpmn` file in any editor, copy the XML.
3. Create `<scenario-id>.json` in this folder with:
   - `id` — kebab-case, unique
   - `chip.label` — shown on the chip in the Copilot pane (≤ 60 chars)
   - `chip.prompt` — auto-filled into the prompt input when the chip is clicked
   - `steps[]` — ordered; one entry per BPMN element in the order it should
     appear during progressive rendering. Each step:
     - `type: "element"`
     - `elementId` — must match an `id` attribute inside `resultXml`
     - `bpmnType` — `bpmn:StartEvent`, `bpmn:UserTask`, etc.
     - `name` — display name (matches `resultXml`)
     - `narration` — one-line user-facing description shown in the narration strip
     - `rationale` — one-sentence reasoning shown in the action log
     - `targetField` — optional; dotted path identifying a properties-panel
       field to focus when this log entry is clicked
     - `durationMs` — how long this step takes before the next begins
   - `resultXml` — the full BPMN XML of the target diagram
4. Register the scenario in `index.js`.
5. Smoke test: run the scenario spec (`npm run test -- --grep "Scenario"`) to
   verify schema conformance.

## Constraints

- Keep scenarios to linear + one exclusive gateway (current prototype scope).
- Element IDs in `steps` must exist in `resultXml`.
- Narration strings are user-visible copy — review for tone.
- Rationale strings are the primary AI-shaped moment in the demo. Write them
  with craft. Avoid templated phrasing like "because the prompt mentioned X".
