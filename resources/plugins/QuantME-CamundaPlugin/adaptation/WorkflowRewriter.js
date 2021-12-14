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

/**
 * Rewrite the workflow available within the given modeler using the given optimization candidate
 *
 * @param modeler the modeler containing the workflow to rewrite
 * @param candidate the candidate to perform the rewrite for
 * @return an error message if the rewriting failed
 */
export async function rewriteWorkflow(modeler, candidate) {
  console.log('Starting rewrite for candidate: ', candidate);
  let modeling = modeler.get('modeling');
  let elementRegistry = modeler.get('elementRegistry');

  // get entry point of the hybrid loop to retrieve ingoing sequence flow
  let entryPoint = elementRegistry.get(candidate.entryPoint.id).businessObject;
  console.log('Entry point: ', entryPoint);

  // get exit point of the hybrid loop to retrieve outgoing sequence flow
  let exitPoint = elementRegistry.get(candidate.exitPoint.id).businessObject;
  console.log('Exit point: ', exitPoint);

  // calculate initial position of the new service task
  let x = calculatePosition(entryPoint.di.bounds.x, exitPoint.di.bounds.x);
  let y = calculatePosition(entryPoint.di.bounds.y, exitPoint.di.bounds.y);

  // retrieve parent of the hybrid loop elements to add replacing service task
  let parent = elementRegistry.get(entryPoint.$parent.id);
  console.log('Parent element of the hybrid loop: ', parent);

  // add new service task to invoke the hybrid runtime
  let invokeHybridRuntime = modeling.createShape({ type: 'bpmn:ServiceTask' }, { x: x, y: y }, parent, {});
  console.log('Added ServiceTask to replace hybrid loop: ', invokeHybridRuntime);
  let invokeHybridRuntimeBo = elementRegistry.get(invokeHybridRuntime.id).businessObject;
  invokeHybridRuntimeBo.name = 'Invoke Hybrid Program';
  invokeHybridRuntimeBo.deploymentModelUrl = candidate.deploymentModelUrl;

  // redirect ingoing sequence flows of the entry point (except sequence flow representing the loop)
  console.log('Adding ingoing sequence flow to new ServiceTask!');
  for (let i = 0; i < entryPoint.incoming.length; i++) {
    let sequenceFlow = entryPoint.incoming[i];
    if (!candidate.containedElements.filter(e => e.id === sequenceFlow.id).length > 0) {
      console.log('Connecting ServiceTask with: ', sequenceFlow.sourceRef);
      modeling.connect(elementRegistry.get(sequenceFlow.sourceRef.id), invokeHybridRuntime, { type: 'bpmn:SequenceFlow' });
    }
  }

  // redirect outgoing sequence flow
  console.log('Adding outgoing sequence flow to new ServiceTask!');
  for (let i = 0; i < exitPoint.outgoing.length; i++) {
    let sequenceFlow = exitPoint.outgoing[i];
    if (!candidate.containedElements.filter(e => e.id === sequenceFlow.id).length > 0) {
      console.log('Connecting ServiceTask with: ', sequenceFlow.targetRef);
      modeling.connect(invokeHybridRuntime, elementRegistry.get(sequenceFlow.targetRef.id), { type: 'bpmn:SequenceFlow' });
    }
  }
  if (invokeHybridRuntime.outgoing > 1) {
    console.log('Hybrid loop has more than one outgoing sequence flow. Unable to determine corresponding conditions!');
    return { error: 'Hybrid loop has more than one outgoing sequence flow. Unable to determine corresponding conditions!' };
  }

  // remove all replaced modeling constructs of the hybrid loop
  console.log('Removing hybrid loop modeling constructs from workflow!');
  for (let i = 0; i < candidate.containedElements.length; i++) {
    let elementToRemove = candidate.containedElements[i];
    console.log('Removing element: ', elementToRemove);

    // first, only remove sequence flows to avoid reference errors within the workflow
    if (elementToRemove.$type === 'bpmn:SequenceFlow') {
      let element = elementRegistry.get(elementToRemove.id);
      modeling.removeConnection(element);
    }
  }
  for (let i = 0; i < candidate.containedElements.length; i++) {
    let elementToRemove = candidate.containedElements[i];
    console.log('Removing element: ', elementToRemove);

    // second, remove the other modeling constructs
    if (elementToRemove.$type !== 'bpmn:SequenceFlow') {
      let element = elementRegistry.get(elementToRemove.id);
      modeling.removeShape(element);
    }
  }

  // update the graphical visualization in the modeler
  await refreshModeler(modeler);
  return { result : 'success' };
}

/**
 * Calculate the middle of the two given coordinates
 */
function calculatePosition(coordinate1, coordinate2) {
  if (coordinate1 < coordinate2) {
    return coordinate2 - ((coordinate2 - coordinate1) / 2);
  } else {
    return coordinate1 - ((coordinate1 - coordinate2) / 2);
  }
}

/**
 * Reload the XML within the given modeler to visualize all programmatical changes
 *
 * @param modeler the modeler to refresh
 */
async function refreshModeler(modeler) {

  // save the XML of the workflow within the modeler
  let xml = await modeler.get('bpmnjs').saveXML();

  // update the bpmnjs, i.e., the visual representation within the modeler
  await modeler.get('bpmnjs').importXML(xml.xml);
}
