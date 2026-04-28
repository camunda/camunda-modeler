# Camunda Modeler — Prototype Context

## Active Prototype: Guided Start Experience

Branch: `prototype/guided-start-experience`
Epic: fetch live details with `gh issue view <number> --repo camunda/product-hub` (search for "Guided Start Experience")

## Camunda 8 vs Camunda 7

Always target Camunda 8 BPMN files:
- Editor: `client/src/app/tabs/cloud-bpmn/` — NOT `client/src/app/tabs/bpmn/` (legacy C7)
- New BPMN files default to Camunda 8 (cloud-bpmn) format
- Empty diagram template: `client/src/app/tabs/cloud-bpmn/diagram.bpmn`
- Editor component: `client/src/app/tabs/cloud-bpmn/BpmnEditor.js`
- Shared overlay/dialog components live in `client/src/app/tabs/bpmn/` (EmptyCanvasOverlay, StartEventDialog, AiSidePanelTab, GuidedStart.less) and are imported by both editors

## PM Workflow & Epic Context

For PM workflow tasks (writing epics, design review, UAT), use skills from `../product-epics-pilot/`.
For Camunda design system, voice/tone, and accessibility compliance, use the `/carbon-camunda-addon` skill.

## Prototype Principles (reuse before reinvent)

When building React chrome over bpmn-js/diagram-js features:

- **Icons:** bpmn-js icon font is globally imported via `client/src/styles/_modeling.less`. Use `bpmn-icon-*` classes for BPMN glyphs (full list in `node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn.css`). For editor chrome use `@carbon/icons-react` — match the existing vocabulary.
- **Tooltips on drag-start buttons:** `create.start()` captures the pointer, so native `title` tooltips are cancelled mid-hover. Use a custom overlay that hides on `pointerdown` — reference `client/src/app/tabs/cloud-bpmn/rail/RailTooltip.js`.
- **Tools / shapes:** delegate to `toolManager.setActive()` and `create.start(event, shape)` — don't reimplement click/drag semantics.

## Prototype Verification Gate

Before declaring a prototype task done:

1. **Visual check at two viewport heights** (1440×900 and 1280×720). Screenshot touched chrome. Watch for clipping on anything absolutely-positioned with `top:` / `bottom:` inside a flex parent.
2. **Interaction check under pointer capture.** Any drag-start button: verify tooltips + keyboard flow during an actual drag, not just hover.
