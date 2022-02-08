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

import lodash from 'lodash';
import { getRootProcess } from 'client/src/app/quantme/utilities/Utilities';
import { createModelerFromXml } from '../quantme/Utilities';
import generateImage from 'client/src/app/util/generateImage';

/**
 * Find candidates within the current workflow model that can be executed efficiently using a hybrid runtime
 *
 * @param modeler the modeler containing the current workflow model
 * @return the list of optimization candidates
 */
export async function findOptimizationCandidates(modeler) {

  // get the root element of the current workflow model
  const definitions = modeler.getDefinitions();
  const rootElement = getRootProcess(definitions);
  console.log('Searching optimization candidates for workflow with root element: ', rootElement);

  // export xml of the current workflow model to enable a later image creation
  let workflowXml = await modeler.get('bpmnjs').saveXML();

  // get all potential entry points for a hybrid loop
  let entryPoints = findEntryPoints(rootElement);
  console.log('Found %d potential entry points to hybrid loops!', entryPoints.length);

  // check if the entry points are part of valid optimization candidates
  let optimizationCandidates = [];
  for (let i = 0; i < entryPoints.length; i++) {
    let entryPoint = entryPoints[i];
    let outgoingFlow = entryPoint.outgoing[0];
    let nextElement = outgoingFlow.targetRef;

    let optimizationCandidate = getOptimizationCandidate({
      entryPoint: entryPoint,
      currentElement: nextElement,
      containedElements: [entryPoints[i], outgoingFlow]
    });

    // candidate must comprise at least one quantum circuit execution and classical task to benefit from a hybrid runtime
    if (optimizationCandidate !== undefined
      && containsQuantumCircuitExecutionTask(optimizationCandidate)
      && containsClassicalTask(optimizationCandidate)) {

      // generate visual representation of the candidate using base64
      optimizationCandidate = await visualizeCandidate(optimizationCandidate, workflowXml.xml);

      console.log('Found valid optimization candidate: ', optimizationCandidate);
      optimizationCandidates.push(optimizationCandidate);
    } else {
      console.log('Entry point is not part of valid optimization loop: ', entryPoints[i]);
    }
  }

  // return all valid optimization candidates for the analysis and rewrite modal
  return optimizationCandidates;
}

/**
 * Generate an image representing the candidate encoded using base64
 *
 * @param optimizationCandidate the candidate to visualize
 * @param workflowXml the XML of the workflow the candidate belongs to
 * @return the string containing the base64 encoded image
 */
async function visualizeCandidate(optimizationCandidate, workflowXml) {
  console.log('Visualizing optimization candidate: ', optimizationCandidate);

  // create new modeler for the visualization
  let modeler = await createModelerFromXml(workflowXml);
  let modeling = modeler.get('modeling');
  let elementRegistry = modeler.get('elementRegistry');
  let rootElement = getRootProcess(modeler.getDefinitions());

  // remove all flows that are not part of the candidate
  const flowElements = lodash.cloneDeep(rootElement.flowElements);
  console.log('Workflow contains %d elements!', flowElements.length);
  for (let i = 0; i < flowElements.length; i++) {
    let flowElement = flowElements[i];
    if (!optimizationCandidate.containedElements.some(e => e.id === flowElement.id)
      && flowElement.$type === 'bpmn:SequenceFlow') {

      // remove connection from the modeler
      let element = elementRegistry.get(flowElement.id);
      modeling.removeConnection(element);
    }
  }
  console.log('%d elements after filtering sequence flow!', rootElement.flowElements.length);

  // remove all shapes that are not part of the candidate
  for (let i = 0; i < flowElements.length; i++) {
    let flowElement = flowElements[i];
    if (!optimizationCandidate.containedElements.some(e => e.id === flowElement.id)
      && flowElement.$type !== 'bpmn:SequenceFlow') {

      // remove shape from the modeler
      let element = elementRegistry.get(flowElement.id);
      modeling.removeShape(element);
    }
  }
  console.log('Remaining workflow contains %d elements and candidate %d!', rootElement.flowElements.length, optimizationCandidate.containedElements.length);

  // export the candidate as svg
  function saveSvgWrapper() {
    return new Promise((resolve) => {
      modeler.saveSVG((err, successResponse) => {
        resolve(successResponse);
      });
    });
  }

  let svg = await saveSvgWrapper();

  // calculate view box for the SVG
  svg = calculateViewBox(optimizationCandidate, svg, elementRegistry);

  // generate png from svg
  optimizationCandidate.candidateImage = generateImage('png', svg);
  optimizationCandidate.modeler = modeler;
  return optimizationCandidate;
}

/**
 * Calculate the view box for the svg to visualize only the current candidate
 *
 * @param optimizationCandidate the optimization candidate to calculate the view box for
 * @param svg the svg to update the view box to visualize the optimization candidate
 * @param elementRegistry element registry of the modeler containing the complete workflow to access all contained elements
 * @return the updated svg with the calculated view box
 */
function calculateViewBox(optimizationCandidate, svg, elementRegistry) {

  // search for the modeling elements with the minimal and maximal x and y values
  let result = {};
  for (let i = 0; i < optimizationCandidate.containedElements.length; i++) {
    let element = elementRegistry.get(optimizationCandidate.containedElements[i].id);

    // for sequence flows check the position of each waypoint and label
    if (element.type === 'bpmn:SequenceFlow') {
      if (element.waypoints) {
        for (let j = 0; j < element.waypoints.length; j++) {
          let waypoint = element.waypoints[j];

          if (result.minX === undefined || result.minX > waypoint.x) {
            result.minX = waypoint.x;
          }

          if (result.minY === undefined || result.minY > waypoint.y) {
            result.minY = waypoint.y;
          }

          if (result.maxX === undefined || result.maxX < waypoint.x) {
            result.maxX = waypoint.x;
          }

          if (result.maxY === undefined || result.maxY < waypoint.y) {
            result.maxY = waypoint.y;
          }
        }
      }
    } else {

      // handle non sequence flow elements
      result = updateViewBoxCoordinates(result, element);
    }

    // handle labels attached to arbitrary elements
    if (element.labels) {
      for (let j = 0; j < element.labels.length; j++) {
        result = updateViewBoxCoordinates(result, element.labels[j]);
      }
    }
  }

  console.log('Minimum x value for candidate: ', result.minX);
  console.log('Minimum y value for candidate: ', result.minY);
  console.log('Maximum x value for candidate: ', result.maxX);
  console.log('Maximum y value for candidate: ', result.maxY);

  let width, height, x, y;
  if (result.minX === undefined || result.minY === undefined || result.maxX === undefined || result.maxY === undefined) {
    console.log('Error: unable to find modeling element with minimum and maximum x and y values!');

    // default values in case an error occurred
    width = 1000;
    height = 1000;
    x = 0;
    y = 0;
  } else {

    // calculate view box and add a margin of 10 to the min/max values
    x = result.minX - 10;
    y = result.minY - 10;
    width = result.maxX - result.minX + 20;
    height = result.maxY - result.minY + 20;
  }

  return svg.replace('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" viewBox="0 0 0 0" version="1.1">',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="' + x + ' ' + y + ' ' + width + ' ' + height + '" version="1.1">');
}

/**
 * Update the view box coordinates with the coordinates of the given element if they provide higher/lower values for max/min
 *
 * @param coordindates the current view box coordinates, i.e., the min/max for x and y
 * @param element the element to check if it provides new coordinates for the view box
 * @return the updated view box coordinates
 */
function updateViewBoxCoordinates(coordindates, element) {

  if (coordindates.minX === undefined || coordindates.minX > element.x) {
    coordindates.minX = element.x;
  }

  if (coordindates.minY === undefined || coordindates.minY > element.y) {
    coordindates.minY = element.y;
  }

  // max x and y also incorporate the width of the current element
  if (coordindates.maxX === undefined || coordindates.maxX < element.x + element.width) {
    coordindates.maxX = element.x + element.width;
  }

  if (coordindates.maxY === undefined || coordindates.maxY < element.y + element.height) {
    coordindates.maxY = element.y + element.height;
  }

  return coordindates;
}

/**
 * Find all potential entry points to a hybrid loop
 *
 * @param rootElement the root element of the workflow model
 * @return the list of potential entry points to a hybrid loop
 */
function findEntryPoints(rootElement) {
  let entryPoints = [];

  // we currently restrict the entry point search to XOR gateways
  Array.prototype.push.apply(entryPoints, getXOREntryPoints(rootElement));

  return entryPoints;
}

/**
 * Find all XOR gateways in the workflow model that are potential entry points to a hybrid loop
 *
 * @param rootElement the root element of the workflow model
 * @return the list of XOR gateways
 */
function getXOREntryPoints(rootElement) {
  let entryPoints = [];

  // search for XOR gateways within the workflow
  const flowElements = rootElement.flowElements;
  for (let i = 0; i < flowElements.length; i++) {
    let flowElement = flowElements[i];
    if (flowElement.$type && flowElement.$type === ('bpmn:ExclusiveGateway')) {
      console.log('Found exclusive gateway: ', flowElement);

      // the gateway should have exactly one outgoing flow representing the control flow of the hybrid loop
      if (flowElement.outgoing.length === 1) {
        console.log('Exclusive gateway is potential entry point: ', flowElement);
        entryPoints.push(flowElement);
      }
    }
  }

  return entryPoints;
}

/**
 * Analyse the next modeling element for the given candidate and add it to the list of modeling elements.
 * Abort if unsuitable modeling element occurs.
 *
 * @param candidate the candidate to analyse
 * @return {undefined} the updated candidate or undefined if the candidate is invalid
 */
function getOptimizationCandidate(candidate) {
  console.log('Analyzing optimization candidate: ', candidate);

  // each element except the entry point of the candidate is only allowed to have one incoming flow,
  // as the hybrid runtime can only be invoked through the entry point and there are no other entries possible
  if (!candidate.currentElement.incoming || candidate.currentElement.incoming.length !== 1) {
    console.log('Element has more or less than one ingoing flow: ', candidate.currentElement);

    // found complete candidate
    if (candidate.currentElement.id === candidate.entryPoint.id) {
      return candidate;
    } else {
      return undefined;
    }
  }

  // each element except the exit point of the candidate is only allowed to have one outgoing flow (no branching within candidates)
  if (!candidate.currentElement.outgoing || candidate.currentElement.outgoing.length !== 1) {
    console.log('Element has more or less than one outgoing flow: ', candidate.currentElement);

    // found exit point, continue until entry point is reached again or invalid element is reached
    if (candidate.currentElement.$type && candidate.currentElement.$type === ('bpmn:ExclusiveGateway')
      && candidate.currentElement.outgoing.length === 2 && !candidate.exitPoint) {
      console.log('Found exit point for candidate: ', candidate.currentElement);

      // store exit point and follow both outgoing paths to check if the end in the entry point forming a complete candidate
      candidate.exitPoint = candidate.currentElement;

      // follow first path
      let pathOneCandidate = lodash.cloneDeep(candidate);
      let pathOneSequenceFlow = candidate.currentElement.outgoing[0];
      let pathOneNextElement = pathOneSequenceFlow.targetRef;
      pathOneCandidate.expression = pathOneSequenceFlow.conditionExpression;
      pathOneCandidate.containedElements.push(candidate.currentElement, pathOneSequenceFlow);
      pathOneCandidate.currentElement = pathOneNextElement;
      let pathOneResult = getOptimizationCandidate(pathOneCandidate);

      // check if candidate is complete or invalid
      if (pathOneResult !== undefined) {
        console.log('Found suitable candidate loop!');
        return pathOneResult;
      }
      console.log('First path did not result in valid candidate. Following second path...');

      // follow second path
      let pathTwoCandidate = candidate;
      let pathTwoSequenceFlow = candidate.currentElement.outgoing[1];
      let pathTwoNextElement = pathTwoSequenceFlow.targetRef;
      pathTwoCandidate.expression = pathTwoSequenceFlow.conditionExpression;
      pathTwoCandidate.containedElements.push(candidate.currentElement, pathTwoSequenceFlow);
      pathTwoCandidate.currentElement = pathTwoNextElement;
      return getOptimizationCandidate(pathTwoCandidate);
    } else {
      return undefined;
    }
  }
  candidate.containedElements.push(candidate.currentElement);

  // get outgoing sequence flow of current element
  let outgoingFlow = candidate.currentElement.outgoing[0];
  candidate.containedElements.push(outgoingFlow);

  // move to the next element recursively
  candidate.currentElement = outgoingFlow.targetRef;
  return getOptimizationCandidate(candidate);
}


/**
 * Check if the candidate comprises a quantum circuit execution task
 *
 * @param candidate the candidate to analyse
 * @return true if the candidate comprises a quantum circuit execution task, false otherwise
 */
function containsQuantumCircuitExecutionTask(candidate) {
  for (let i = 0; i < candidate.containedElements.length; i++) {
    let element = candidate.containedElements[i];
    if (element.$type && element.$type === ('quantme:QuantumCircuitExecutionTask')) {
      return true;
    }
  }

  console.log('No quantum circuit execution task found. Candidate invalid: ', candidate);
  return false;
}

/**
 * Check if the candidate comprises a classical task, i.e., service or script task
 *
 * @param candidate the candidate to analyse
 * @return true if the candidate comprises a classical task, false otherwise
 */
function containsClassicalTask(candidate) {
  for (let i = 0; i < candidate.containedElements.length; i++) {
    let element = candidate.containedElements[i];
    if (element.$type && (element.$type === ('bpmn:ServiceTask') || element.$type === ('bpmn:ScriptTask'))) {
      return true;
    }
  }

  console.log('No classical task found. Candidate invalid: ', candidate);
  return false;
}
