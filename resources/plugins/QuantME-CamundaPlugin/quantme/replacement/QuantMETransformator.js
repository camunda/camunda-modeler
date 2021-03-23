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

import { layout } from './Layouter';
import { matchesQRM } from './QuantMEMatcher';
import {
  getRootProcess,
  getRootProcessFromXml,
  getSingleFlowElement,
  isFlowLikeElement,
  getCamundaInputOutput,
  getPropertiesToCopy,
  exportXmlFromModeler
} from '../Utilities';
import { addQuantMEInputParameters } from './InputOutputHandler';
import * as Constants from '../Constants';
import { replaceHardwareSelectionSubprocess } from './hardware-selection/QuantMEHardwareSelectionHandler';
import { createModelerFromXml } from './ModelerGenerator';

/**
 * Initiate the replacement process for the QuantME tasks that are contained in the current process model
 *
 * @param xml the BPMN diagram in XML format
 * @param currentQRMs the set of currently in the framework available QRMs
 * @param endpointConfig endpoints of the services required for the dynamic hardware selection
 */
export async function startReplacementProcess(xml, currentQRMs, endpointConfig) {
  let modeler = await createModelerFromXml(xml);
  let bpmnReplace = modeler.get('bpmnReplace');
  let modeling = modeler.get('modeling');
  let factory = modeler.get('bpmnFactory');
  let elementRegistry = modeler.get('elementRegistry');

  // get root element of the current diagram
  const rootElement = getRootProcess(modeler.getDefinitions());
  if (typeof rootElement === 'undefined') {
    console.log('Unable to retrieve root process element from definitions!');
    return { status: 'failed', cause: 'Unable to retrieve root process element from definitions!' };
  }

  // get all QuantME modeling constructs from the process
  const replacementConstructs = getQuantMETasks(rootElement, elementRegistry);
  console.log('Process contains ' + replacementConstructs.length + ' QuantME modeling constructs to replace...');
  if (!replacementConstructs || !replacementConstructs.length) {
    return { status: 'transformed', xml: xml };
  }

  // check for available replacement models for all QuantME modeling constructs
  for (let replacementConstruct of replacementConstructs) {
    if (replacementConstruct.task.$type === Constants.QUANTUM_HARDWARE_SELECTION_SUBPROCESS) {
      console.log('QuantumHardwareSelectionSubprocess needs no QRM. Skipping search...');
      continue;
    }

    // abort transformation if at least one task can not be replaced
    replacementConstruct.qrm = await getMatchingQRM(replacementConstruct.task, currentQRMs);
    if (!replacementConstruct.qrm) {
      console.log('Unable to replace task with id %s. Aborting transformation!', replacementConstruct.task.id);
      return {
        status: 'failed',
        cause: 'Unable to replace task with id \'' + replacementConstruct.task.id + '\' by suited QRM!'
      };
    }
  }

  // replace each QuantME modeling construct to retrieve standard-compliant BPMN
  for (let replacementConstruct of replacementConstructs) {

    let replacementSuccess = false;
    if (replacementConstruct.task.$type === Constants.QUANTUM_HARDWARE_SELECTION_SUBPROCESS) {
      console.log('Transforming QuantumHardwareSelectionSubprocess...');
      replacementSuccess = await replaceHardwareSelectionSubprocess(replacementConstruct.task, replacementConstruct.parent, factory,
        bpmnReplace, elementRegistry, modeling, endpointConfig.nisqAnalyzerEndpoint, endpointConfig.transformationFrameworkEndpoint, endpointConfig.camundaEndpoint);
    } else {
      console.log('Replacing task with id %s by using QRM: ', replacementConstruct.task.id, replacementConstruct.qrm);
      replacementSuccess = await replaceByFragment(replacementConstruct.task, replacementConstruct.parent, replacementConstruct.qrm.replacement, factory, bpmnReplace, elementRegistry, modeling);
    }

    if (!replacementSuccess) {
      console.log('Replacement of QuantME modeling construct with Id ' + replacementConstruct.task.id + ' failed. Aborting process!');
      return {
        status: 'failed',
        cause: 'Replacement of QuantME modeling construct with Id ' + replacementConstruct.task.id + ' failed. Aborting process!'
      };
    }
  }

  // layout diagram after successful transformation
  layout(modeling, elementRegistry, rootElement);

  return { status: 'transformed', xml: await exportXmlFromModeler(modeler) };
}

/**
 * Get QuantME tasks from process
 */
export function getQuantMETasks(process, elementRegistry) {

  // retrieve parent object for later replacement
  const processBo = elementRegistry.get(process.id);

  const quantmeTasks = [];
  const flowElements = process.flowElements;
  for (let i = 0; i < flowElements.length; i++) {
    let flowElement = flowElements[i];
    if (flowElement.$type && flowElement.$type.startsWith('quantme:')) {
      quantmeTasks.push({ task: flowElement, parent: processBo });
    }

    // recursively retrieve QuantME tasks if subprocess is found
    if (flowElement.$type && flowElement.$type === 'bpmn:SubProcess') {
      Array.prototype.push.apply(quantmeTasks, getQuantMETasks(flowElement, elementRegistry));
    }
  }
  return quantmeTasks;
}

/**
 * Search for a matching QRM for the given task
 */
async function getMatchingQRM(task, currentQRMs) {
  console.log('Number of available QRMs: ', currentQRMs.length);

  for (let i = 0; i < currentQRMs.length; i++) {
    if (await matchesQRM(currentQRMs[i], task)) {
      return currentQRMs[i];
    }
  }
  return undefined;
}

/**
 * Replace the given task by the content of the replacement fragment
 */
async function replaceByFragment(task, parent, replacement, bpmnFactory, bpmnReplace, elementRegistry, modeling) {

  if (!replacement) {
    console.log('Replacement fragment is undefined. Aborting replacement!');
    return false;
  }

  // get the root process of the replacement fragment
  let replacementProcess = await getRootProcessFromXml(replacement);
  let replacementElement = getSingleFlowElement(replacementProcess);
  if (replacementElement === null || replacementElement === undefined) {
    console.log('Unable to retrieve QuantME task from replacement fragment: ', replacement);
    return false;
  }

  console.log('Replacement element: ', replacementElement);
  let result = insertShape(parent, replacementElement, {}, true, bpmnReplace, elementRegistry, modeling, task);

  // add all attributes of the replaced QuantME task to the input parameters of the replacement fragment
  let inputOutputExtension = getCamundaInputOutput(result['element'].businessObject, bpmnFactory);
  addQuantMEInputParameters(task, inputOutputExtension, bpmnFactory);

  return result['success'];
}

/**
 * Insert the given element and all child elements into the diagram
 *
 * @param parent the parent element under which the new element should be attached
 * @param newElement the new element to insert
 * @param idMap the idMap containing a mapping of ids defined in newElement to the new ids in the diagram
 * @param replace true if the element should be inserted instead of an available element, false otherwise
 * @param bpmnReplace the facility to replace BPMN elements
 * @param elementRegistry the registry to retrieve elements from the diagram
 * @param modeling the facility to access shapes in the diagram
 * @param oldElement an old element that is only required if it should be replaced by the new element
 * @return {{success: boolean, idMap: *, element: *}}
 */
export function insertShape(parent, newElement, idMap, replace, bpmnReplace, elementRegistry, modeling, oldElement) {
  console.log('Inserting shape for element: ', newElement);

  // create new id map if not provided
  if (idMap === undefined) {
    idMap = {};
  }

  let element;
  if (!isFlowLikeElement(newElement.$type)) {
    if (replace) {

      // replace old element to retain attached sequence flow, associations, data objects, ...
      element = bpmnReplace.replaceElement(elementRegistry.get(oldElement.id), { type: newElement.$type });
    } else {

      // create new shape for this element
      element = modeling.createShape({ type: newElement.$type }, { x: 50, y: 50 }, parent, {});
    }
  } else {

    // create connection between two previously created elements
    let sourceElement = elementRegistry.get(idMap[newElement.sourceRef.id]);
    let targetElement = elementRegistry.get(idMap[newElement.targetRef.id]);
    element = modeling.connect(sourceElement, targetElement, { type: newElement.$type });
  }

  // store id to create sequence flows
  idMap[newElement['id']] = element.id;

  // if the element is a subprocess, check if it is expanded in the replacement fragment and expand the new element
  if (newElement.$type === 'bpmn:SubProcess') {

    // get the shape element related to the subprocess
    let shape = newElement.di;
    if (shape && shape.isExpanded) {

      // expand the new element
      elementRegistry.get(element.id).businessObject.di.isExpanded = true;
    }
  }

  // add element to which a boundary event is attached
  if (newElement.$type === 'bpmn:BoundaryEvent') {
    let hostElement = elementRegistry.get(idMap[newElement.attachedToRef.id]);
    modeling.updateProperties(element, { 'attachedToRef': hostElement.businessObject });
    element.host = hostElement;
  }

  // update the properties of the new element
  modeling.updateProperties(element, getPropertiesToCopy(newElement));

  // recursively handle children of the current element
  let resultTuple = insertChildElements(element, newElement, idMap, bpmnReplace, elementRegistry, modeling);

  // add artifacts with their shapes to the diagram
  let success = resultTuple['success'];
  idMap = resultTuple['idMap'];
  let artifacts = newElement.artifacts;
  if (artifacts) {
    console.log('Element contains %i artifacts. Adding corresponding shapes...', artifacts.length);
    for (let i = 0; i < artifacts.length; i++) {
      let result = insertShape(element, artifacts[i], idMap, false, bpmnReplace, elementRegistry, modeling);
      success = success && result['success'];
      idMap = result['idMap'];
    }
  }

  // return success flag and idMap with id mappings of this element and all children
  return { success: success, idMap: idMap, element: element };
}

/**
 * Insert all children of the given element into the diagram
 *
 * @param parent the element that is the new parent of the inserted elements
 * @param newElement the new element to insert the children for
 * @param idMap the idMap containing a mapping of ids defined in newElement to the new ids in the diagram
 * @param bpmnReplace the facility to replace BPMN elements
 * @param elementRegistry the registry to retrieve elements from the diagram
 * @param modeling the facility to access shapes in the diagram
 * @return {{success: boolean, idMap: *, element: *}}
 */
function insertChildElements(parent, newElement, idMap, bpmnReplace, elementRegistry, modeling) {

  let success = true;
  let flowElements = newElement.flowElements;
  let boundaryEvents = [];
  let sequenceflows = [];
  if (flowElements) {
    console.log('Element contains %i children. Adding corresponding shapes...', flowElements.length);
    for (let i = 0; i < flowElements.length; i++) {

      // skip elements with references and add them after all other elements to set correct references
      if (flowElements[i].$type === 'bpmn:SequenceFlow') {
        sequenceflows.push(flowElements[i]);
        continue;
      }
      if (flowElements[i].$type === 'bpmn:BoundaryEvent') {
        boundaryEvents.push(flowElements[i]);
        continue;
      }

      let result = insertShape(parent, flowElements[i], idMap, false, bpmnReplace, elementRegistry, modeling);
      success = success && result['success'];
      idMap = result['idMap'];
    }

    // handle boundary events with new ids of added elements
    for (let i = 0; i < boundaryEvents.length; i++) {
      let result = insertShape(parent, boundaryEvents[i], idMap, false, bpmnReplace, elementRegistry, modeling);
      success = success && result['success'];
      idMap = result['idMap'];
    }

    // handle boundary events with new ids of added elements
    for (let i = 0; i < sequenceflows.length; i++) {
      let result = insertShape(parent, sequenceflows[i], idMap, false, bpmnReplace, elementRegistry, modeling);
      success = success && result['success'];
      idMap = result['idMap'];
    }
  }

  return { success: success, idMap: idMap, element: parent };
}
