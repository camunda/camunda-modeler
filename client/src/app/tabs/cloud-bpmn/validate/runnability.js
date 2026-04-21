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
 * runnability — per-element rules for the Validate mode.
 *
 * The rule stays as a plain lookup rather than nested conditionals so the
 * PM, designer, and engineer edit one table. Every branch returns the same
 * shape so callers never have to check which field is populated.
 *
 *   isRunnable(element) → {
 *     enabled: boolean,
 *     advisory: string | null,    // shown above Run when enabled but caveated
 *     explanation: string | null  // shown inline when disabled
 *   }
 */

const ADVISORY_USER_TASK = 'User tasks require manual claim & complete in Tasklist — this run will hang until someone picks it up.';
const ADVISORY_AGENTIC = 'Agentic subprocess validation is best-effort in Camunda 8.9. Treat results as indicative.';
const ADVISORY_CALL_ACTIVITY = 'Called process must also be deployed for this to succeed.';

const EXPLAIN_GATEWAY = 'Gateways route, they don\u2019t execute — validate the task on either side.';
const EXPLAIN_BOUNDARY = 'Boundary events attach to a task — validate the parent task instead.';
const EXPLAIN_END = 'End events terminate the process — nothing to run.';
const EXPLAIN_CATCH = 'Catch events wait for an external signal — not directly runnable from here.';
const EXPLAIN_THROW = 'Throw events emit a signal — the preceding task is what you want to validate.';
const EXPLAIN_TRIGGERED_START = 'This start event requires an external trigger. Use a plain start or a downstream task.';
const EXPLAIN_NON_EXEC = 'This element isn\u2019t executable.';

const RUNNABLE = { enabled: true, advisory: null, explanation: null };

/**
 * Detect agentic subprocesses. Two-layer rule so we don't block on the
 * 8.9 moddle attribute landing:
 *   1. Preferred: zeebe:adHocSubProcess moddle flag
 *   2. Fallback: name matches /\bagent(ic)?\b/i
 * The advisory copy is conservative enough that a false positive is
 * harmless (it reads as a "this might be agentic" disclaimer).
 */
export function isAgenticSubprocess(element) {
  const bo = element && element.businessObject;
  if (!bo || bo.$type !== 'bpmn:SubProcess') return false;

  try {
    if (bo.get && bo.get('zeebe:adHocSubProcess')) return true;
  } catch (e) { /* moddle attribute not registered yet — fall through */ }

  const name = bo.name || '';
  return /\bagent(ic)?\b/i.test(name);
}

function isPlainStartEvent(element) {
  const bo = element.businessObject;
  if (!bo || bo.$type !== 'bpmn:StartEvent') return false;
  const defs = bo.eventDefinitions || [];
  return defs.length === 0;
}

export function isRunnable(element) {
  if (!element || !element.businessObject) {
    return { enabled: false, advisory: null, explanation: EXPLAIN_NON_EXEC };
  }

  const type = element.businessObject.$type;

  // Agentic subprocess detection takes precedence over the plain SubProcess row.
  if (type === 'bpmn:SubProcess' && isAgenticSubprocess(element)) {
    return { enabled: true, advisory: ADVISORY_AGENTIC, explanation: null };
  }

  switch (type) {
  case 'bpmn:ServiceTask':
  case 'bpmn:BusinessRuleTask':
  case 'bpmn:ScriptTask':
  case 'bpmn:SendTask':
  case 'bpmn:ReceiveTask':
  case 'bpmn:ManualTask':
  case 'bpmn:Task':
  case 'bpmn:SubProcess':
    return RUNNABLE;

  case 'bpmn:UserTask':
    return { enabled: true, advisory: ADVISORY_USER_TASK, explanation: null };

  case 'bpmn:CallActivity':
    return { enabled: true, advisory: ADVISORY_CALL_ACTIVITY, explanation: null };

  case 'bpmn:StartEvent':
    return isPlainStartEvent(element)
      ? RUNNABLE
      : { enabled: false, advisory: null, explanation: EXPLAIN_TRIGGERED_START };

  case 'bpmn:ExclusiveGateway':
  case 'bpmn:ParallelGateway':
  case 'bpmn:EventBasedGateway':
  case 'bpmn:InclusiveGateway':
  case 'bpmn:ComplexGateway':
    return { enabled: false, advisory: null, explanation: EXPLAIN_GATEWAY };

  case 'bpmn:BoundaryEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_BOUNDARY };

  case 'bpmn:EndEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_END };

  case 'bpmn:IntermediateCatchEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_CATCH };

  case 'bpmn:IntermediateThrowEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_THROW };

  default:
    return { enabled: false, advisory: null, explanation: EXPLAIN_NON_EXEC };
  }
}
