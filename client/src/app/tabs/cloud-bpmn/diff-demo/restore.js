/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

/**
 * PROTOTYPE: restore functions for hard-coded changes, each returning
 * `(injector, element) => void` which reverts the change via modeling
 * (and is therefore undoable).
 */

export function restoreName(name) {
  return (injector, element) => {
    injector.get('modeling').updateProperties(element, { name });
  };
}

export function restoreDocumentation(text) {
  return (injector, element) => {
    const modeling = injector.get('modeling');

    const businessObject = getBusinessObject(element);

    const documentation = businessObject.get('documentation')[ 0 ];

    if (documentation) {
      modeling.updateModdleProperties(element, documentation, { text });
    } else {
      const newDocumentation = injector.get('bpmnFactory').create('bpmn:Documentation', { text });

      modeling.updateModdleProperties(element, businessObject, {
        documentation: [ newDocumentation ]
      });
    }
  };
}

/**
 * Restore a property of an extension element, e.g. `zeebe:TaskDefinition#type`.
 */
export function restoreExtensionProperty(type, property, value) {
  return (injector, element) => {
    const extensionElement = getExtensionElement(element, type);

    if (extensionElement) {
      injector.get('modeling').updateModdleProperties(element, extensionElement, {
        [ property ]: value
      });
    }
  };
}

/**
 * Restore a property of an existing `zeebe:Input` or `zeebe:Output`.
 *
 * @param {'inputParameters'|'outputParameters'} collection
 */
export function restoreIoParameterProperty(collection, index, property, value) {
  return (injector, element) => {
    const ioMapping = getExtensionElement(element, 'zeebe:IoMapping');

    const parameter = ioMapping && ioMapping.get(collection)[ index ];

    if (parameter) {
      injector.get('modeling').updateModdleProperties(element, parameter, {
        [ property ]: value
      });
    }
  };
}

/**
 * Re-add a removed `zeebe:Input` or `zeebe:Output`. It is appended so list
 * entry IDs (index based) of other items stay valid.
 *
 * @param {'inputParameters'|'outputParameters'} collection
 * @param {'zeebe:Input'|'zeebe:Output'} type
 */
export function restoreIoParameter(collection, type, attrs) {
  return (injector, element) => {
    const modeling = injector.get('modeling');
    const bpmnFactory = injector.get('bpmnFactory');

    const ioMapping = getExtensionElement(element, 'zeebe:IoMapping');

    // prototype: the demo diagram always keeps its io mapping
    if (!ioMapping) {
      return;
    }

    const parameter = bpmnFactory.create(type, attrs);

    parameter.$parent = ioMapping;

    modeling.updateModdleProperties(element, ioMapping, {
      [ collection ]: [ ...ioMapping.get(collection), parameter ]
    });
  };
}

function getExtensionElement(element, type) {
  const extensionElements = getBusinessObject(element).get('extensionElements');

  return extensionElements && extensionElements.get('values').find(value => value.$instanceOf(type));
}
