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

import QuantMEMatcher from './QuantMEMatcher';
import { requiredAttributesAvailable } from './QuantMEAttributeChecker';
import { getRootProcess, getRootProcessFromXml, getSingleFlowElement, isQuantMETask } from './Utilities';

let QRMs = [];

export default class QuantMETransformator {

  constructor(injector, bpmnjs, modeling, elementRegistry, eventBus) {

    // register the startReplacementProcess() function as editor action to enable the invocation from the menu
    const editorActions = injector.get('editorActions', false);

    // update locally stored QRMs if update is received
    eventBus.on('QRMs.updated', 1000, (event) => {
      console.log('Received event to update QRMs!');
      QRMs = event.data;
    });

    // update current QRMs from repository on action in Camunda editor menu
    editorActions && editorActions.register({
      updateFromQRMRepo: function() {
        updateFromQRMRepo();
      }
    });

    // start replacement on action in Camunda editor menu
    editorActions && editorActions.register({
      startReplacementProcess: async function() {
        await startReplacementProcess();
      }
    });

    /**
     * Initiate the replacement process for the QuantME tasks that are contained in the current process model
     */
    async function startReplacementProcess() {
      console.log('Starting test process for the current process model...');

      // get root element of the current diagram
      const rootElement = getRootProcess(bpmnjs.getDefinitions());
      if (typeof rootElement === 'undefined') {
        console.log('Unable to retrieve root process element from definitions!');
        return;
      }
      const rootElementBo = elementRegistry.get(rootElement.id);

      // get all QuantME tasks from the process
      const quantmeTasks = getQuantMETasks(rootElement);
      console.log('Process contains ' + quantmeTasks.length + ' QuantME tasks to replace...');

      // replace each QuantME tasks to retrieve standard-compliant BPMN
      for (let i = 0; i < quantmeTasks.length; i++) {
        const replacementSuccess = await replaceQuantMETask(quantmeTasks[i], rootElementBo);
        if (!replacementSuccess) {
          console.log('Replacement of QuantME task with Id ' + quantmeTasks[i].id + ' failed. Aborting process!');
          return;
        }
      }
    }

    /**
     * Get QuantME tasks from process
     */
    function getQuantMETasks(process) {
      const quantmeTasks = [];
      const flowElements = process.flowElements;
      for (let i = 0; i < flowElements.length; i++) {
        var flowElement = flowElements[i];
        if (flowElement.$type && flowElement.$type.startsWith('quantme:')) {
          quantmeTasks.push(flowElement);
        }
      }
      return quantmeTasks;
    }

    /**
     * Replace the given QuantME tasks by a suited QRM
     */
    async function replaceQuantMETask(task, parent) {
      console.log('Replacing QuantME task with id: %s', task.id);
      for (let i = 0; i < QRMs.length; i++) {
        let qrm = QRMs[i];
        if (await QuantMEMatcher.matchesQRM(qrm, task)) {
          console.log('Found matching detector. Starting replacement!');
          return await replaceByFragment(task, parent, qrm.replacement);
        }
      }
      console.log('No matching QRM found for task with id: %s', task.id);
      return false;
    }

    /**
     * Replace the given task by the content of the replacement fragment
     */
    async function replaceByFragment(task, parent, replacement) {

      // get the root process of the replacement fragment
      let replacementProcess = await getRootProcessFromXml(replacement);
      let replacementElement = getSingleFlowElement(replacementProcess);
      if (replacementElement === null) {
        console.log('Unable to retrieve QuantME task from replacement fragment: ', replacement);
        return false;
      }

      // TODO: replace task with QRM
      console.log('Replacement element: ', replacementElement);
      return false;
    }

    /**
     * Initiate the replacement process for the QuantME tasks that are contained in the current process model
     */
    function updateFromQRMRepo() {
      // request a update of the currently stored QRMs
      console.log('Updating QRMs from repository!');
      eventBus.fire('QRMs.update', {});
    }
  }
}

QuantMETransformator.$inject = ['injector', 'bpmnjs', 'modeling', 'elementRegistry', 'eventBus'];

/**
 * Check whether the given QuantME task can be replaced by an available QRM, which means check if a matching detector can be found
 *
 * @param element the element representing the QuantME task
 * @returns {boolean} true if the task can be replaced, false otherwise
 */
export async function isReplaceable(element) {

  // check for required attributes
  if (!requiredAttributesAvailable(element)) {
    console.log('Missing required attributes. Replacement not possible!');
    return false;
  }

  // search for a suited QRM that can replace the given task
  for (let i = 0; i < QRMs.length; i++) {
    if (await QuantMEMatcher.matchesQRM(QRMs[i], element)) {
      return true;
    }
  }

  // no suited QRM found, and therefore, no replacement possible
  console.log('No suited QRM found for task: ', element);
  return true; // FIXME: QRMs are currently not accessible from this method
}
