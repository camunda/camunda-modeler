/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import BpmnModeler from 'bpmn-js/lib/Modeler';
import elementTemplates from 'bpmn-js-properties-panel/lib/provider/camunda/element-templates';
import quantMEModule from '../quantme';
import quantMEExtension from '../resources/quantum4bpmn.json';

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
 * Get the root process from a xml string representing a BPMN diagram
 *
 * @param xml the xml representing the BPMN diagram
 * @return the root process from the xml definitions
 */
export async function getRootProcessFromXml(xml) {

  // create new modeler with the custom QuantME extensions
  const bpmnModeler = new BpmnModeler({
    additionalModules: [
      elementTemplates,
      quantMEModule
    ],
    moddleExtensions: {
      quantME: quantMEExtension
    }
  });

  // import the xml containing the definitions
  function importXmlWrapper(xml) {
    return new Promise((resolve) => {
      bpmnModeler.importXML(xml,(successResponse) => {
        resolve(successResponse);
      });
    });
  }
  await importXmlWrapper(xml);

  // extract and return root process
  return getRootProcess(bpmnModeler.getDefinitions());
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
