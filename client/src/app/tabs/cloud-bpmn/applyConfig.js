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
 * Shared helpers for applying guided-wizard config onto a placed shape.
 *
 * Used by both the Start Event flow and the Guided Append flow so the two
 * code paths can't drift. Each helper is a no-op if the relevant config key
 * is absent, so callers can always invoke every helper with the same config
 * object.
 */

/**
 * Write the user-chosen label onto the placed shape (not onto the process).
 */
export function applyName(modeler, shape, config) {
  if (!config || !config.name) return;
  const modeling = modeler.get('modeling');
  modeling.updateProperties(shape, { name: config.name });
}

/**
 * Timer: write timeCycle / timeDate onto the event definition.
 *
 * `config.timer = { type: 'timeCycle' | 'timeDate', value: string }`
 */
export function applyTimer(modeler, shape, config) {
  if (!config || !config.timer) return;
  const eventDef = shape.businessObject.eventDefinitions &&
                   shape.businessObject.eventDefinitions[0];
  if (!eventDef) return;

  const modeling = modeler.get('modeling');
  const bpmnFactory = modeler.get('bpmnFactory');

  modeling.updateModdleProperties(shape, eventDef, {
    [config.timer.type]: bpmnFactory.create('bpmn:FormalExpression', {
      body: config.timer.value
    })
  });
}

/**
 * Message: create a global bpmn:Message and link it via messageRef.
 * Mirrors the "Create new..." action in the properties panel.
 */
export function applyMessage(modeler, shape, config) {
  if (!config || !config.messageName) return;
  const eventDef = shape.businessObject.eventDefinitions &&
                   shape.businessObject.eventDefinitions[0];
  if (!eventDef) return;

  const bpmnFactory = modeler.get('bpmnFactory');
  const commandStack = modeler.get('commandStack');
  const definitions = modeler.getDefinitions();

  const message = bpmnFactory.create('bpmn:Message', { name: config.messageName });
  message.$parent = definitions;

  commandStack.execute('properties-panel.multi-command-executor', [
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element: shape,
        moddleElement: definitions,
        properties: {
          rootElements: [ ...definitions.get('rootElements'), message ]
        }
      }
    },
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element: shape,
        moddleElement: eventDef,
        properties: { messageRef: message }
      }
    }
  ]);
}

/**
 * Signal: create a global bpmn:Signal and link it via signalRef.
 */
export function applySignal(modeler, shape, config) {
  if (!config || !config.signalName) return;
  const eventDef = shape.businessObject.eventDefinitions &&
                   shape.businessObject.eventDefinitions[0];
  if (!eventDef) return;

  const bpmnFactory = modeler.get('bpmnFactory');
  const commandStack = modeler.get('commandStack');
  const definitions = modeler.getDefinitions();

  const signal = bpmnFactory.create('bpmn:Signal', { name: config.signalName });
  signal.$parent = definitions;

  commandStack.execute('properties-panel.multi-command-executor', [
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element: shape,
        moddleElement: definitions,
        properties: {
          rootElements: [ ...definitions.get('rootElements'), signal ]
        }
      }
    },
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element: shape,
        moddleElement: eventDef,
        properties: { signalRef: signal }
      }
    }
  ]);
}

/**
 * Write a zeebe:FormDefinition extension element for a user task.
 *
 * `config.form = { type: 'camunda-form-linked' | 'camunda-form-embedded' | 'external', id?, formKey? }`
 *
 * For the prototype we only support camunda-form-linked (by formId) — the
 * other forms are labelled but not wired up beyond that.
 */
export function applyUserTaskForm(modeler, shape, config) {
  if (!config || !config.form) return;

  const bpmnFactory = modeler.get('bpmnFactory');
  const modeling = modeler.get('modeling');

  const businessObject = shape.businessObject;
  let extensionElements = businessObject.get('extensionElements');
  const existingValues = extensionElements ? [ ...extensionElements.get('values') ] : [];

  const formDefinition = bpmnFactory.create('zeebe:FormDefinition', {
    formId: config.form.formId || config.form.id || 'my-form'
  });

  const newExtensionElements = bpmnFactory.create('bpmn:ExtensionElements', {
    values: [ ...existingValues, formDefinition ]
  });
  formDefinition.$parent = newExtensionElements;
  newExtensionElements.$parent = businessObject;

  modeling.updateModdleProperties(shape, businessObject, {
    extensionElements: newExtensionElements
  });
}

/**
 * Write a zeebe:CalledElement extension for a call activity.
 */
export function applyCalledElement(modeler, shape, config) {
  if (!config || !config.calledElement) return;

  const bpmnFactory = modeler.get('bpmnFactory');
  const modeling = modeler.get('modeling');

  const businessObject = shape.businessObject;
  let extensionElements = businessObject.get('extensionElements');
  const existingValues = extensionElements ? [ ...extensionElements.get('values') ] : [];

  const calledElement = bpmnFactory.create('zeebe:CalledElement', {
    processId: config.calledElement
  });

  const newExtensionElements = bpmnFactory.create('bpmn:ExtensionElements', {
    values: [ ...existingValues, calledElement ]
  });
  calledElement.$parent = newExtensionElements;
  newExtensionElements.$parent = businessObject;

  modeling.updateModdleProperties(shape, businessObject, {
    extensionElements: newExtensionElements
  });
}

/**
 * Apply the chosen trigger type to an IntermediateThrowEvent by swapping it to
 * a catch event with the right event definition. We do this by creating the
 * proper shape upstream; this helper is for post-placement tweaks if needed.
 *
 * For the prototype, the IntermediateEventWizard reuses TimerWizard /
 * MessageWizard / SignalWizard and their output flows through applyTimer /
 * applyMessage / applySignal — so this helper is a no-op placeholder.
 */
export function applyIntermediateTrigger(/* modeler, shape, config */) {
  // intentionally empty — timer/message/signal are applied via their own helpers
}
