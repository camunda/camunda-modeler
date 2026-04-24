/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Single source of truth for the guided append picker.
 *
 * Groups carry outcome-framed labels ("A person does something"); leaves carry
 * BPMN-accurate names ("User Task") and the metadata needed to (a) decide which
 * Step 2 wizard to open and (b) place the right shape on confirm.
 *
 * Each leaf's `elementId` is an opaque token that BpmnEditor.handleAppend uses
 * to map to a concrete BPMN type + optional event definition / template.
 *
 * Icons use the `bpmn-font` shipped by bpmn-js (loaded globally via
 * `src/styles/_modeling.less`). Strings prefixed `bpmn-icon-` render through
 * the font; anything else renders as text/unicode.
 */

export const APPEND_GROUPS = [
  {
    id: 'tasks',
    label: 'Tasks',
    outcome: 'Something needs to happen',
    icon: 'bpmn-icon-task',
    leaves: [
      { elementId: 'task', label: 'Plain task', wizard: null, hint: 'Generic task — configure later', icon: 'bpmn-icon-task', keywords: 'generic placeholder' },
      { elementId: 'user-task', label: 'User task', wizard: 'user-task', hint: 'A person does something', icon: 'bpmn-icon-user-task', keywords: 'human person approve review assign form' },
      { elementId: 'service-task', label: 'Service task', wizard: 'service-task', hint: 'A system does something', icon: 'bpmn-icon-service-task', keywords: 'system job worker automated' },
      { elementId: 'script-task', label: 'Script task', wizard: null, hint: 'Run a script inline', icon: 'bpmn-icon-script-task', keywords: 'code feel expression inline' },
      { elementId: 'send-task', label: 'Send task', wizard: null, hint: 'Send something outbound', icon: 'bpmn-icon-send-task', keywords: 'publish emit message outbound' },
      { elementId: 'receive-task', label: 'Receive task', wizard: null, hint: 'Wait for something inbound', icon: 'bpmn-icon-receive-task', keywords: 'wait inbound subscribe correlate' },
      { elementId: 'business-rule-task', label: 'Business rule task', wizard: null, hint: 'Evaluate a DMN table or RPA bot', icon: 'bpmn-icon-business-rule-task', keywords: 'dmn decision rule rpa evaluate' },
      { elementId: 'manual-task', label: 'Manual task', wizard: null, hint: 'Work done offline — no system involved', icon: 'bpmn-icon-manual-task', keywords: 'offline paper human no-system' }
    ]
  },
  {
    id: 'gateways',
    label: 'Gateways',
    outcome: 'Decide which path to take',
    icon: 'bpmn-icon-gateway-none',
    leaves: [
      { elementId: 'exclusive-gateway', label: 'Exclusive gateway', wizard: null, hint: 'One path wins — XOR', icon: 'bpmn-icon-gateway-xor', keywords: 'xor branch if-else decision one' },
      { elementId: 'parallel-gateway', label: 'Parallel gateway', wizard: null, hint: 'All paths run — AND', icon: 'bpmn-icon-gateway-parallel', keywords: 'and fork split all' },
      { elementId: 'inclusive-gateway', label: 'Inclusive gateway', wizard: null, hint: 'Some paths run — OR', icon: 'bpmn-icon-gateway-or', keywords: 'or some conditional multi' },
      { elementId: 'event-gateway', label: 'Event-based gateway', wizard: null, hint: 'First event wins', icon: 'bpmn-icon-gateway-eventbased', keywords: 'event-based race first wins' }
    ]
  },
  {
    id: 'intermediate-events',
    label: 'Intermediate events',
    outcome: 'Pause, wait, or signal something',
    icon: 'bpmn-icon-intermediate-event-none',
    leaves: [
      { elementId: 'intermediate-event', label: 'Intermediate event', wizard: 'intermediate-event', hint: 'Wait for a timer, message, or signal', icon: 'bpmn-icon-intermediate-event-none', keywords: 'timer message signal wait catch throw' },
      { elementId: 'end-event', label: 'End event', wizard: null, hint: 'End this path', icon: 'bpmn-icon-end-event-none', keywords: 'terminate finish complete done' }
    ]
  },
  {
    id: 'call-activity',
    label: 'Call activity',
    outcome: 'Call another process',
    icon: 'bpmn-icon-call-activity',
    leaves: [
      { elementId: 'call-activity', label: 'Call activity', wizard: 'call-activity', hint: 'Invoke another BPMN process', icon: 'bpmn-icon-call-activity', keywords: 'subprocess reuse invoke nested' }
    ]
  },
  {
    id: 'connector',
    label: 'Connector',
    outcome: 'Talk to an external system',
    icon: 'bpmn-icon-service-task',
    leaves: [
      { elementId: 'connector', label: 'Connector', wizard: 'service-task', hint: 'Pick a REST / Slack / Email / … template', icon: 'bpmn-icon-service-task', keywords: 'integration rest http api external' }
    ]
  },
  {
    id: 'ai-agents',
    label: 'AI Agents',
    outcome: 'Use AI in this step',
    icon: 'bpmn-icon-subprocess-expanded',
    leaves: [
      { elementId: 'ai-agent-subprocess', label: 'AI Agent sub-process', wizard: null, hint: 'Let an AI agent orchestrate multiple steps', icon: 'bpmn-icon-subprocess-expanded', keywords: 'agentic llm orchestrate tool calls' },
      { elementId: 'ai-connector', label: 'Single AI action', wizard: 'service-task', hint: 'One call to an AI connector template', icon: 'bpmn-icon-service-task', keywords: 'llm prompt completion one-shot' }
    ]
  },
  {
    id: 'from-catalog',
    label: 'From Catalog',
    outcome: 'Reuse a proven building block',
    icon: '◈', // No BPMN equivalent — categories of reusable patterns
    stub: true,
    leaves: [
      { elementId: 'catalog:approval', label: 'Approval pattern', wizard: 'catalog-stub', hint: 'Coming soon' },
      { elementId: 'catalog:enrichment', label: 'Data enrichment', wizard: 'catalog-stub', hint: 'Coming soon' },
      { elementId: 'catalog:notify', label: 'Notify stakeholders', wizard: 'catalog-stub', hint: 'Coming soon' }
    ]
  }
];

/**
 * Maps leaf `elementId` → `{ type, eventDefinitionType? }` for `elementFactory.createShape`.
 *
 * Leaves that need a template (connector, ai-connector) are placed as a base task
 * and the template is applied afterwards by the wizard's `config.template`.
 */
export const ELEMENT_SHAPE_MAP = {
  'task':               { type: 'bpmn:Task' },
  'user-task':          { type: 'bpmn:UserTask' },
  'service-task':       { type: 'bpmn:ServiceTask' },
  'script-task':        { type: 'bpmn:ScriptTask' },
  'send-task':          { type: 'bpmn:SendTask' },
  'receive-task':       { type: 'bpmn:ReceiveTask' },
  'business-rule-task': { type: 'bpmn:BusinessRuleTask' },
  'manual-task':        { type: 'bpmn:ManualTask' },
  'exclusive-gateway':  { type: 'bpmn:ExclusiveGateway' },
  'parallel-gateway':   { type: 'bpmn:ParallelGateway' },
  'inclusive-gateway':  { type: 'bpmn:InclusiveGateway' },
  'event-gateway':      { type: 'bpmn:EventBasedGateway' },
  'intermediate-event': { type: 'bpmn:IntermediateThrowEvent' }, // trigger type applied in wizard
  'end-event':          { type: 'bpmn:EndEvent' },
  'call-activity':      { type: 'bpmn:CallActivity' },
  'connector':          { type: 'bpmn:ServiceTask' },
  'ad-hoc-subprocess':   { type: 'bpmn:AdHocSubProcess', isExpanded: true, width: 350, height: 200 },
  'ai-agent-subprocess': { type: 'bpmn:AdHocSubProcess', isExpanded: true, width: 350, height: 200 },
  'ai-connector':       { type: 'bpmn:ServiceTask' }
};

/**
 * Look up a leaf by elementId across all groups.
 */
export function findLeaf(elementId) {
  for (const group of APPEND_GROUPS) {
    const leaf = group.leaves.find(l => l.elementId === elementId);
    if (leaf) return { group, leaf };
  }
  return null;
}
