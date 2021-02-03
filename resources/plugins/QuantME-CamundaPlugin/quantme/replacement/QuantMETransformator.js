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

import { PureComponent } from 'camunda-modeler-plugin-helpers/react';
import { layout } from './Layouter';
import { matchesQRM } from './QuantMEMatcher';
import {
  getRootProcess,
  getRootProcessFromXml,
  getSingleFlowElement,
  isFlowLikeElement,
  getCamundaInputOutput,
  getPropertiesToCopy
} from '../Utilities';
import { addQuantMEInputParameters } from './InputOutputHandler';

export default class QuantMETransformator extends PureComponent {

  constructor(props) {

    super(props);

    // get QuantME component from the backend, e.g., to retrieve current QRMs
    this.quantME = props._getGlobal('quantME');
  }

  componentDidMount() {

    // initialize component with created modeler
    this.props.subscribe('bpmn.modeler.created', (event) => {

      const {
        modeler
      } = event;

      // load components required to access, adapt, and transform the current QuantME workflow
      this.bpmnjs = modeler.get('bpmnjs');
      this.bpmnFactory = modeler.get('bpmnFactory');
      this.elementRegistry = modeler.get('elementRegistry');
      this.editorActions = modeler.get('editorActions');
      this.bpmnReplace = modeler.get('bpmnReplace');
      this.modeling = modeler.get('modeling');

      // register actions to enable invocation over the menu
      const self = this;
      this.editorActions.register({
        updateFromQRMRepo: function() {
          self.quantME.updateQRMs().then(response => {
            console.log('Update of QRMs completed: ', response);
          }).catch(e => {
            self.props.displayNotification({
              type: 'warning',
              title: 'Unable to load QRMs',
              content: e,
              duration: 20000
            });
          });
        }
      });
      this.editorActions.register({
        startReplacementProcess: function() {
          self.startReplacementProcess().then(() => console.log('Transformation finished!'));
        }
      });

      // trigger initial QRM update
      this.quantME.updateQRMs().then(response => {
        console.log('Update of QRMs completed: ', response);
      }).catch(e => {
        self.props.displayNotification({
          type: 'warning',
          title: 'Unable to load QRMs',
          content: e,
          duration: 20000
        });
      });
    });
  }

  /**
   * Initiate the replacement process for the QuantME tasks that are contained in the current process model
   */
  async startReplacementProcess() {
    console.log('Starting replacement process for the current process model...');

    // get root element of the current diagram
    const rootElement = getRootProcess(this.bpmnjs.getDefinitions());
    if (typeof rootElement === 'undefined') {
      console.log('Unable to retrieve root process element from definitions!');
      return;
    }

    // get all QuantME tasks from the process
    const replacementTasks = this.getQuantMETasks(rootElement);
    console.log('Process contains ' + replacementTasks.length + ' QuantME tasks to replace...');
    if (!replacementTasks || !replacementTasks.length) {
      return;
    }

    // check for available replacement models for all QuantME tasks
    for (let replacementTask of replacementTasks) {

      // abort transformation if at least one task can not be replaced
      replacementTask.qrm = await this.getMatchingQRM(replacementTask.task);
      if (!replacementTask.qrm) {
        console.log('Unable to replace task with id %s. Aborting transformation!', replacementTask.task.id);

        // inform user via notification in the modeler
        this.props.displayNotification({
          type: 'warning',
          title: 'Unable to transform workflow',
          content: 'Unable to replace task with id \'' + replacementTask.task.id + '\' by suited QRM',
          duration: 10000
        });
        return;
      }
    }

    // replace each QuantME tasks to retrieve standard-compliant BPMN
    for (let replacementTask of replacementTasks) {
      console.log('Replacing task with id %s by using QRM: ', replacementTask.task.id, replacementTask.qrm);
      const replacementSuccess = await this.replaceByFragment(replacementTask.task, replacementTask.parent, replacementTask.qrm.replacement);
      if (!replacementSuccess) {
        console.log('Replacement of QuantME task with Id ' + replacementTask.task.id + ' failed. Aborting process!');
        return;
      }
    }

    // layout diagram after successful transformation
    layout(this.modeling, this.elementRegistry, rootElement);
  }

  /**
   * Get QuantME tasks from process
   */
  getQuantMETasks(process) {

    // retrieve parent object for later replacement
    const processBo = this.elementRegistry.get(process.id);

    const quantmeTasks = [];
    const flowElements = process.flowElements;
    for (let i = 0; i < flowElements.length; i++) {
      let flowElement = flowElements[i];
      if (flowElement.$type && flowElement.$type.startsWith('quantme:')) {
        quantmeTasks.push({ task: flowElement, parent: processBo });
      }

      // recursively retrieve QuantME tasks if subprocess is found
      if (flowElement.$type && flowElement.$type === 'bpmn:SubProcess') {
        Array.prototype.push.apply(quantmeTasks, this.getQuantMETasks(flowElement));
      }
    }
    return quantmeTasks;
  }

  /**
   * Search for a matching QRM for the given task
   */
  async getMatchingQRM(task) {
    let currentQRMs = await this.quantME.getQRMs();
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
  async replaceByFragment(task, parent, replacement) {

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
    let result = this.insertShape(parent, replacementElement, {}, true, task);

    // add all attributes of the replaced QuantME task to the input parameters of the replacement fragment
    let inputOutputExtension = getCamundaInputOutput(result['element'].businessObject, this.bpmnFactory);
    addQuantMEInputParameters(task, inputOutputExtension, this.bpmnFactory);

    return result['success'];
  }

  /**
   * Insert the given element and all child elements into the diagram
   *
   * @param parent the parent element under which the new element should be attached
   * @param newElement the new element to insert
   * @param idMap the idMap containing a mapping of ids defined in newElement to the new ids in the diagram
   * @param replace true if the element should be inserted instead of an available element, false otherwise
   * @param oldElement an old element that is only required if it should be replaced by the new element
   * @return {{success: boolean, idMap: *, element: *}}
   */
  insertShape(parent, newElement, idMap, replace, oldElement) {
    console.log('Inserting shape for element: ', newElement);

    // create new id map if not provided
    if (idMap === undefined) {
      idMap = {};
    }

    let element;
    if (!isFlowLikeElement(newElement.$type)) {
      if (replace) {

        // replace old element to retain attached sequence flow, associations, data objects, ...
        element = this.bpmnReplace.replaceElement(this.elementRegistry.get(oldElement.id), { type: newElement.$type });
      } else {

        // create new shape for this element
        element = this.modeling.createShape({ type: newElement.$type }, { x: 50, y: 50 }, parent, {});
      }
    } else {

      // create connection between two previously created elements
      let sourceElement = this.elementRegistry.get(idMap[newElement.sourceRef.id]);
      let targetElement = this.elementRegistry.get(idMap[newElement.targetRef.id]);
      element = this.modeling.connect(sourceElement, targetElement, { type: newElement.$type });
    }

    // store id to create sequence flows
    idMap[newElement['id']] = element.id;

    // if the element is a subprocess, check if it is expanded in the replacement fragment and expand the new element
    if (newElement.$type === 'bpmn:SubProcess') {

      // get the shape element related to the subprocess
      let shape = newElement.di;
      if (shape && shape.isExpanded) {

        // expand the new element
        this.elementRegistry.get(element.id).businessObject.di.isExpanded = true;
      }
    }

    // add element to which a boundary event is attached
    if (newElement.$type === 'bpmn:BoundaryEvent') {
      let hostElement = this.elementRegistry.get(idMap[newElement.attachedToRef.id]);
      this.modeling.updateProperties(element, { 'attachedToRef': hostElement.businessObject });
      element.host = hostElement;
    }

    // update the properties of the new element
    this.modeling.updateProperties(element, getPropertiesToCopy(newElement));

    // recursively handle children of the current element
    let resultTuple = this.insertChildElements(element, newElement, idMap);

    // add artifacts with their shapes to the diagram
    let success = resultTuple['success'];
    idMap = resultTuple['idMap'];
    let artifacts = newElement.artifacts;
    if (artifacts) {
      console.log('Element contains %i artifacts. Adding corresponding shapes...', artifacts.length);
      for (let i = 0; i < artifacts.length; i++) {
        let result = this.insertShape(element, artifacts[i], idMap, false);
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
   * @return {{success: boolean, idMap: *, element: *}}
   */
  insertChildElements(parent, newElement, idMap) {

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

        let result = this.insertShape(parent, flowElements[i], idMap, false);
        success = success && result['success'];
        idMap = result['idMap'];
      }

      // handle boundary events with new ids of added elements
      for (let i = 0; i < boundaryEvents.length; i++) {
        let result = this.insertShape(parent, boundaryEvents[i], idMap, false);
        success = success && result['success'];
        idMap = result['idMap'];
      }

      // handle boundary events with new ids of added elements
      for (let i = 0; i < sequenceflows.length; i++) {
        let result = this.insertShape(parent, sequenceflows[i], idMap, false);
        success = success && result['success'];
        idMap = result['idMap'];
      }
    }

    return { success: success, idMap: idMap, element: parent };
  }

  render() {
    return null;
  }
}
