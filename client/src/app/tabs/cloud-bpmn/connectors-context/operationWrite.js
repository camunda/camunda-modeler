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
 * Write an element-template Dropdown value back to the BPMN model.
 *
 * Handles the two binding shapes used by every marketplace connector
 * template we've inspected:
 *
 *   - `zeebe:input`  → value lives in a zeebe:Input element nested under
 *                       a zeebe:IoMapping inside extensionElements
 *                       (Slack `method`, Salesforce `salesforceInteractionType`,
 *                       GitHub method, etc.)
 *
 *   - `property`     → direct attribute on the businessObject
 *                       (rare for connectors; common for plain BPMN props)
 *
 * Anything else is a no-op — the bpmn-io properties-panel still owns those
 * write paths. Errors are logged but don't throw; this is prototype code.
 *
 * Persists through save/reopen because we use bpmn-js's modeling APIs
 * (commandStack-aware, so undo/redo work too).
 *
 * @param {object} modeler   - bpmn-js modeler instance
 * @param {object} element   - selected diagram element (with .businessObject)
 * @param {object} property  - element-template property (with .binding)
 * @param {string} value     - new value to write
 */
export function writeOperationValue(modeler, element, property, value) {
  try {
    if (!modeler || !element || !property || !property.binding) return;

    const modeling = modeler.get('modeling', false);
    const moddle = modeler.get('moddle', false);
    if (!modeling || !moddle) return;

    const binding = property.binding;

    if (binding.type === 'property' && binding.name) {
      modeling.updateProperties(element, { [binding.name]: value });
      return;
    }

    if (binding.type === 'zeebe:input' && binding.name) {
      writeZeebeInput(modeling, moddle, element, binding.name, value);
      return;
    }

    // Other binding types (zeebe:taskHeader, zeebe:property, hidden, etc.)
    // fall through silently — bpmn-io's properties-panel handles them.
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[connectors-context] operation write-back failed', err);
  }
}

/**
 * Update or create the `zeebe:Input` parameter whose `target` matches the
 * given name, setting its `source` to the new value.
 *
 * Creates ExtensionElements + IoMapping on demand if they don't exist yet
 * (the case for a freshly-applied template that hasn't had inputs set).
 */
function writeZeebeInput(modeling, moddle, element, targetName, value) {
  const businessObject = element.businessObject;
  if (!businessObject) return;

  // Ensure extensionElements exists.
  let extensionElements = businessObject.get('extensionElements');
  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    extensionElements.$parent = businessObject;
    modeling.updateProperties(element, { extensionElements });
  }

  // Find or create the zeebe:IoMapping.
  const values = extensionElements.get('values') || [];
  let ioMapping = values.find(v => v && v.$type === 'zeebe:IoMapping');

  if (!ioMapping) {
    ioMapping = moddle.create('zeebe:IoMapping', {
      inputParameters: [],
      outputParameters: []
    });
    ioMapping.$parent = extensionElements;
    modeling.updateModdleProperties(element, extensionElements, {
      values: [ ...values, ioMapping ]
    });
  }

  // Find existing input parameter with matching target, or create one.
  // Cover both common moddle accessors — older bpmn-io builds expose direct
  // property access on Input, newer ones go through `.get()`.
  const inputs = ioMapping.get('inputParameters') || [];
  const existing = inputs.find(p => p && (
    (typeof p.get === 'function' && p.get('target') === targetName)
    || p.target === targetName
  ));

  if (existing) {
    modeling.updateModdleProperties(element, existing, { source: value });
    return;
  }

  const input = moddle.create('zeebe:Input', {
    target: targetName,
    source: value
  });
  input.$parent = ioMapping;
  modeling.updateModdleProperties(element, ioMapping, {
    inputParameters: [ ...inputs, input ]
  });
}
