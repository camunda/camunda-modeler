/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { APPEND_GROUPS, ELEMENT_SHAPE_MAP } from '../../bpmn/appendCatalog';

/**
 * Adapter: primary-shape type → rail flyout payload.
 *
 * Why not inline in the component: the rail needs a different grain of data
 * than Guided Append. `appendCatalog.js` is the source of truth for **wizard
 * flows** (one leaf per wizard path — e.g. a generic "intermediate event"
 * leaf that then asks the user for a trigger type). The rail places elements
 * *directly* via `create.start()` with no wizard, so it needs BPMN-concrete
 * variants per event-definition type.
 *
 * Rule of thumb:
 *   - Variants that map 1:1 to distinct BPMN types (Tasks, Gateways) → pull
 *     directly from appendCatalog to prevent label/icon drift.
 *   - Variants that differ only by event-definition type (Intermediate Catch /
 *     Throw × Message / Timer / Signal / Escalation) → define locally here,
 *     since appendCatalog collapses them behind a wizard.
 *
 * Returns null for primary shapes that have no variants worth surfacing
 * (StartEvent, EndEvent, SubProcess, TextAnnotation) — those render as flat
 * buttons in the rail.
 */

const APPEND_GROUP_BY_ID = APPEND_GROUPS.reduce((acc, group) => {
  acc[group.id] = group;
  return acc;
}, {});

/**
 * Build a variant entry from an appendCatalog leaf.
 * Leaves whose elementId isn't in ELEMENT_SHAPE_MAP (catalog stubs, etc.) are
 * skipped — the rail only surfaces things `create.start` can actually place.
 */
function leafToVariant(leaf) {
  const shape = ELEMENT_SHAPE_MAP[leaf.elementId];
  if (!shape || !shape.type) return null;

  return {
    type: shape.type,
    label: leaf.label,
    iconClass: leaf.icon || null,
    eventDefinitionType: shape.eventDefinitionType || null
  };
}

function variantsFromGroup(groupId) {
  const group = APPEND_GROUP_BY_ID[groupId];
  if (!group) return [];
  return group.leaves.map(leafToVariant).filter(Boolean);
}

/**
 * Intermediate event variants defined locally — appendCatalog treats the
 * trigger-type pick as a wizard Step 2, which doesn't suit the rail's direct-
 * insert affordance. Six variants cover 95% of real-world usage.
 *
 * Icon classes reference the bpmn-js icon font (imported globally via
 * `src/styles/_modeling.less`); glyph list in
 * `node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn.css`.
 */
const INTERMEDIATE_EVENT_VARIANTS = [
  {
    type: 'bpmn:IntermediateCatchEvent',
    label: 'Message catch',
    iconClass: 'bpmn-icon-intermediate-event-catch-message',
    eventDefinitionType: 'bpmn:MessageEventDefinition'
  },
  {
    type: 'bpmn:IntermediateCatchEvent',
    label: 'Timer catch',
    iconClass: 'bpmn-icon-intermediate-event-catch-timer',
    eventDefinitionType: 'bpmn:TimerEventDefinition'
  },
  {
    type: 'bpmn:IntermediateCatchEvent',
    label: 'Signal catch',
    iconClass: 'bpmn-icon-intermediate-event-catch-signal',
    eventDefinitionType: 'bpmn:SignalEventDefinition'
  },
  {
    type: 'bpmn:IntermediateThrowEvent',
    label: 'Message throw',
    iconClass: 'bpmn-icon-intermediate-event-throw-message',
    eventDefinitionType: 'bpmn:MessageEventDefinition'
  },
  {
    type: 'bpmn:IntermediateThrowEvent',
    label: 'Signal throw',
    iconClass: 'bpmn-icon-intermediate-event-throw-signal',
    eventDefinitionType: 'bpmn:SignalEventDefinition'
  },
  {
    type: 'bpmn:IntermediateThrowEvent',
    label: 'None (throw)',
    iconClass: 'bpmn-icon-intermediate-event-none',
    eventDefinitionType: null
  },
  { type: 'bpmn:IntermediateCatchEvent', label: 'Conditional catch', iconClass: 'bpmn-icon-intermediate-event-catch-condition', eventDefinitionType: 'bpmn:ConditionalEventDefinition' },
  { type: 'bpmn:IntermediateCatchEvent', label: 'Link catch',        iconClass: 'bpmn-icon-intermediate-event-catch-link',      eventDefinitionType: 'bpmn:LinkEventDefinition' },
  { type: 'bpmn:IntermediateThrowEvent', label: 'Escalation throw',  iconClass: 'bpmn-icon-intermediate-event-throw-escalation', eventDefinitionType: 'bpmn:EscalationEventDefinition' },
  { type: 'bpmn:IntermediateThrowEvent', label: 'Compensation throw', iconClass: 'bpmn-icon-intermediate-event-throw-compensation', eventDefinitionType: 'bpmn:CompensationEventDefinition' },
  { type: 'bpmn:IntermediateThrowEvent', label: 'Link throw',        iconClass: 'bpmn-icon-intermediate-event-throw-link',      eventDefinitionType: 'bpmn:LinkEventDefinition' },
];

/**
 * Primary-shape → { label, variants[] } map. Undefined primaries render flat.
 */
const VARIANT_MAP = {
  'bpmn:StartEvent': {
    label: 'Start event',
    variants: [
      { type: 'bpmn:StartEvent', label: 'None (plain)', iconClass: 'bpmn-icon-start-event-none', eventDefinitionType: null },
      { type: 'bpmn:StartEvent', label: 'Message start', iconClass: 'bpmn-icon-start-event-message', eventDefinitionType: 'bpmn:MessageEventDefinition' },
      { type: 'bpmn:StartEvent', label: 'Timer start', iconClass: 'bpmn-icon-start-event-timer', eventDefinitionType: 'bpmn:TimerEventDefinition' },
      { type: 'bpmn:StartEvent', label: 'Signal start', iconClass: 'bpmn-icon-start-event-signal', eventDefinitionType: 'bpmn:SignalEventDefinition' },
      { type: 'bpmn:StartEvent', label: 'Conditional start', iconClass: 'bpmn-icon-start-event-condition', eventDefinitionType: 'bpmn:ConditionalEventDefinition' },
    ]
  },
  'bpmn:Task': {
    label: 'Task',
    variants: variantsFromGroup('tasks')
  },
  'bpmn:ExclusiveGateway': {
    label: 'Gateway',
    variants: variantsFromGroup('gateways')
  },
  'bpmn:IntermediateCatchEvent': {
    label: 'Intermediate event',
    variants: INTERMEDIATE_EVENT_VARIANTS
  },
  'bpmn:SubProcess': {
    label: 'Sub-process',
    variants: [
      { type: 'bpmn:SubProcess', label: 'Expanded', iconClass: 'bpmn-icon-subprocess-expanded', attrs: { isExpanded: true } },
      { type: 'bpmn:SubProcess', label: 'Collapsed', iconClass: 'bpmn-icon-subprocess-collapsed', attrs: { isExpanded: false } },
      { type: 'bpmn:SubProcess', label: 'Event sub-process', iconClass: 'bpmn-icon-event-subprocess-expanded', attrs: { isExpanded: true, triggeredByEvent: true } },
    ]
  },
  'bpmn:EndEvent': {
    label: 'End event',
    variants: [
      { type: 'bpmn:EndEvent', label: 'None (plain)', iconClass: 'bpmn-icon-end-event-none', eventDefinitionType: null },
      { type: 'bpmn:EndEvent', label: 'Message end', iconClass: 'bpmn-icon-end-event-message', eventDefinitionType: 'bpmn:MessageEventDefinition' },
      { type: 'bpmn:EndEvent', label: 'Error end', iconClass: 'bpmn-icon-end-event-error', eventDefinitionType: 'bpmn:ErrorEventDefinition' },
      { type: 'bpmn:EndEvent', label: 'Escalation end', iconClass: 'bpmn-icon-end-event-escalation', eventDefinitionType: 'bpmn:EscalationEventDefinition' },
      { type: 'bpmn:EndEvent', label: 'Signal end', iconClass: 'bpmn-icon-end-event-signal', eventDefinitionType: 'bpmn:SignalEventDefinition' },
      { type: 'bpmn:EndEvent', label: 'Compensation end', iconClass: 'bpmn-icon-end-event-compensation', eventDefinitionType: 'bpmn:CompensationEventDefinition' },
      { type: 'bpmn:EndEvent', label: 'Terminate', iconClass: 'bpmn-icon-end-event-terminate', eventDefinitionType: 'bpmn:TerminateEventDefinition' },
    ]
  },
  'bpmn:AdHocSubProcess': {
    label: 'AI Agents',
    variants: [
      {
        type: 'bpmn:AdHocSubProcess',
        label: 'AI Agent sub-process',
        iconClass: 'bpmn-icon-ad-hoc-marker',
        attrs: { isExpanded: true, width: 350, height: 200 },
        templateId: 'io.camunda.connectors.agenticai.aiagent.subprocess.v1'
      },
      {
        type: 'bpmn:ServiceTask',
        label: 'AI Agent task',
        iconClass: 'bpmn-icon-service-task',
        attrs: {},
        templateId: 'io.camunda.connectors.agenticai.aiagent.v1'
      },
    ]
  },
};

/**
 * Given a primary BPMN type, return its flyout payload — or null if the
 * primary has no variants worth surfacing (renders as a flat button).
 */
export function getShapeVariants(primaryType) {
  return VARIANT_MAP[primaryType] || null;
}

/**
 * Build the `create.start` attrs object for a variant.
 *
 * Centralized here so both the flyout and any future call-site apply the
 * same defaults (e.g. SubProcess must be expanded, intermediate events need
 * an event-definition type).
 */
export function buildVariantAttrs(variant) {
  return {
    type: variant.type,
    ...(variant.eventDefinitionType ? { eventDefinitionType: variant.eventDefinitionType } : {}),
    ...(variant.attrs || {})
  };
}
