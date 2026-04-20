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
