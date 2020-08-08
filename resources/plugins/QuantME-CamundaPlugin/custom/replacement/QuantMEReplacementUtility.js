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

let QuantMEAttributeChecker = require('./QuantMEAttributeChecker');

let QRMs = [];

export default class QuantMEReplacementUtility {

  constructor(injector, bpmnjs, modeling, elementRegistry, eventBus) {

    // register the startReplacementProcess() function as editor action to enable the invocation from the menu
    const editorActions = injector.get('editorActions', false);

    console.log('bpmnJs methods: ');
    console.log(getMethods(bpmnjs));

    console.log('modeling methods: ');
    console.log(getMethods(modeling));

    // update locally stored QRMs if update is received
    eventBus.on('QRMs.updated', 1000, (event) => {
      console.log('Recevied event to update QRMs!');
      QRMs = event.data;
    });

    // start replacement on action in Camunda editor menu
    editorActions && editorActions.register({
      startReplacementProcess: function() {
        startReplacementProcess();
      }
    });

    /**
     * Initiate the replacement process for the QuantME tasks that are contained in the current process model
     */
    function startReplacementProcess() {
      console.log('Starting replacement process for the current process model...');

      // request a update of the currently stored QRMs
      eventBus.fire('QRMs.update', {});

      // get root element of the current diagram
      const rootElement = getRootProcess();
      if (typeof rootElement === 'undefined') {
        console.log('Unable to retrieve root process element from definitions!');
        return;
      }
      const rootElementBo = elementRegistry.get(rootElement.id);

      // get all QuantME tasks from the process
      const quantmeTasks = getQuantMETasks(rootElement);
      console.log('Process contains ' + quantmeTasks.length + ' QuantME tasks to replace...');

      // TODO: remove debug logging
      console.log('Definitions: ', bpmnjs.getDefinitions());
      console.log('Root element: ', rootElement);
      console.log('BO: ', rootElementBo);
      console.log('Current QRMs: ', QRMs);

      // replace each QuantME tasks to retrieve standard-compliant BPMN
      for (let i = 0; i < quantmeTasks.length; i++) {
        const replacementSuccess = replaceQuantMETask(quantmeTasks[i], rootElementBo);
        if (!replacementSuccess) {
          console.log('Replacement of QuantME task with Id ' + quantmeTasks[i].id + ' failed. Aborting process!');
          return;
        }
      }
    }

    /**
     * Get the root process element of the diagram
     */
    function getRootProcess() {
      const currentDefinitions = bpmnjs.getDefinitions();
      for (let i = 0; i < currentDefinitions.rootElements.length; i++) {
        if (currentDefinitions.rootElements[i].$type === 'bpmn:Process') {
          return currentDefinitions.rootElements[i];
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
    function replaceQuantMETask(task, parent) {
      console.log('Replacing QuantME task with id: ', task.id);
      // TODO: search for suited QRM; replace task with QRM
      modeling.createShape({ type: 'quantme:ReadoutErrorMitigationTask' }, { x: 50, y: 50 }, parent, {});
      return true;
    }
  }
}

QuantMEReplacementUtility.$inject = ['injector', 'bpmnjs', 'modeling', 'elementRegistry', 'eventBus'];

function getMethods(obj) {
  let properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()].filter(item => typeof obj[item] === 'function');
}


/**
 * Check whether the given QuantME task can be replaced by an available QRM, which means check if a matching detector can be found
 *
 * @param element the element representing the QuantME task
 * @returns {boolean} true if the task can be replaced, false otherwise
 */
export function isReplaceable(element) {

  // check for required attributes
  if (!requiredAttributesAvailable(element)) {
    console.log('Missing required attributes. Replacement not possible!');
    return false;
  }

  // TODO: search for matching detector in QRMs
  console.log('QuantMEReplacementUtility called with element:', element);
  return true;
}

/**
 * Check whether the given QuantME task has all required elements set
 *
 * @param element the element representing the QuantME task
 * @returns {boolean} true if attributes are available, otherwise false
 */
export function requiredAttributesAvailable(element) {
  return QuantMEAttributeChecker.requiredAttributesAvailable(element);
}
