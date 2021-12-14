/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import extensionElementsHelper from 'bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper';
import $ from 'jquery';

/**
 * Get the root process element of the diagram
 */
export function getRootProcess(definitions) {
  for (let i = 0; i < definitions.rootElements.length; i++) {
    if (definitions.rootElements[i].$type === 'bpmn:Process') {
      return definitions.rootElements[i];
    }
  }
}

/**
 * Check if the given task is a QuantME task
 *
 * @param task the task to check
 * @returns true if the passed task is a QuantME task, false otherwise
 */
export function isQuantMETask(task) {
  return task.$type.startsWith('quantme:');
}

/**
 * Export the current diagram in the given modeler as XML
 *
 * @param modeler the modeler to export the diagram
 * @return the XML
 */
export async function exportXmlFromModeler(modeler) {

  // export the xml and return to requester
  function exportXmlWrapper(definitions) {
    return new Promise((resolve) => {
      modeler._moddle.toXML(definitions, (err, successResponse) => {
        resolve(successResponse);
      });
    });
  }
  return await exportXmlWrapper(modeler.getDefinitions());
}

/**
 * Check if the given process contains only one flow element and return it
 *
 * @param process the process to retrieve the flow element from
 * @return the flow element if only one is defined, or undefined if none or multiple flow elements exist in the process
 */
export function getSingleFlowElement(process) {
  let flowElements = process.flowElements;
  if (flowElements.length !== 1) {
    console.log('Process contains %i flow elements but must contain exactly one!', flowElements.length);
    return undefined;
  }
  return flowElements[0];
}

/**
 * Get the 'camunda:InputOutput' extension element from the given business object
 *
 * @param bo the business object to retrieve the input/output extension for
 * @param bpmnFactory the BPMN factory to create new BPMN elements
 */
export function getCamundaInputOutput(bo, bpmnFactory) {

  // retrieve InputOutput element if already defined
  let inputOutput = extensionElementsHelper.getExtensionElements(bo, 'camunda:InputOutput');

  // create new InputOutput element if non existing
  if (!inputOutput || inputOutput.length === 0) {
    bo.extensionElements = extensionElementsHelper.addEntry(bo, bo, bpmnFactory.create('camunda:InputOutput'), bpmnFactory)['extensionElements'];
    inputOutput = extensionElementsHelper.getExtensionElements(bo, 'camunda:InputOutput');

    // initialize parameters as empty arrays to avoid access errors
    inputOutput[0].inputParameters = [];
    inputOutput[0].outputParameters = [];
  }

  // if there are multiple input/output definitions, take the first one as the modeler only uses this one
  return inputOutput[0];
}

/**
 * Check if the given element is a flow like element that is represented as a BPMNEdge in the diagram, such as a SequenceFlow,
 * MessageFlow or an Association
 *
 * @param type the type of the element to check
 * @return true if the given element is a flow like element, false otherwise
 */
export function isFlowLikeElement(type) {
  return type === 'bpmn:SequenceFlow' || type === 'bpmn:Association';

  // TODO: handle further flow like element types
}

/**
 * Get all flow elements recursively starting from the given element
 *
 * @param startElement the element to start the search
 * @return the list of flow elements
 */
export function getFlowElementsRecursively(startElement) {
  let flowElements = [];
  for (let i = 0; i < startElement.flowElements.length; i++) {
    let flowElement = startElement.flowElements[i];

    if (flowElement.$type === 'bpmn:SubProcess') {
      flowElements = flowElements.concat(getFlowElementsRecursively(flowElement));
    } else {
      flowElements.push(flowElement);
    }
  }
  return flowElements;
}

/**
 * Get the properties that have to be copied from an element of a replacement fragment to the new element in the diagram
 *
 * @param element the element to retrieve the properties from
 * @return the properties to copy
 */
export function getPropertiesToCopy(element) {
  let properties = {};
  for (let key in element) {

    // ignore properties from parent element
    if (!element.hasOwnProperty(key)) {
      continue;
    }

    // ignore properties such as type
    if (key.startsWith('$')) {
      continue;
    }

    // ignore id as it is automatically generated with the shape
    if (key === 'id') {
      continue;
    }

    // ignore flow elements, as the children are added afterwards
    if (key === 'flowElements') {
      continue;
    }

    // ignore artifacts, as they are added afterwards with their shapes
    if (key === 'artifacts') {
      continue;
    }

    // ignore messages, as they are added before
    if (key === 'messageRef') {
      continue;
    }

    properties[key] = element[key];
  }

  return properties;
}

export function performAjax(targetUrl, dataToSend) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      type: 'POST',
      url: targetUrl,
      data: dataToSend,
      processData: false,
      contentType: false,
      beforeSend: function() {
      },
      success: function(data) {
        resolve(data);
      },
      error: function(err) {
        reject(err);
      }
    });
  });
}
