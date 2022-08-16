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

import { createModelerFromXml } from '../quantme/Utilities';

/**
 * Rewrite the workflow available within the given modeler using the given optimization candidate
 *
 * @param modeler the modeler containing the workflow to rewrite
 * @param candidate the candidate to perform the rewrite for
 * @param provenanceCollectionEnabled the configuration property of the modeler specifying if provenance data should be collected for hybrid programs
 * @param hybridProgramId the Id of the hybrid program that is used instead of orchestrating the tasks of the candidate
 * @return an error message if the rewriting failed
 */
export async function rewriteWorkflow(modeler, candidate, provenanceCollectionEnabled, hybridProgramId) {
  console.log('Starting rewrite for candidate: ', candidate);
  let modeling = modeler.get('modeling');
  let elementRegistry = modeler.get('elementRegistry');

  // check if views should be created which require the collection of provenance data about hybrid programs
  if (provenanceCollectionEnabled) {

    // check if there is already a view from a previous rewrite and update it then, otherwise, add new view
    let viewElementRegistry, viewModeler;
    if (modeler.views === undefined) {
      console.log('Creating new view!');
      modeler.views = {};
      viewModeler = modeler;
      viewElementRegistry = elementRegistry;
    } else {
      console.log('View before rewriting already exists. Updating existing view!');
      let existingView = modeler.views['view-before-rewriting'];
      console.log('Existing view has Xml: ', existingView);
      viewModeler = await createModelerFromXml(existingView);
      viewElementRegistry = viewModeler.get('elementRegistry');
    }

    // adapt process view before export
    let firstElement = 'true';
    for (let i = 0; i < candidate.containedElements.length; i++) {
      let elementOfCandidate = candidate.containedElements[i];

      // label all tasks within the candidate as part of the hybrid program execution
      if (elementOfCandidate.$type !== 'bpmn:ExclusiveGateway' && elementOfCandidate.$type !== 'bpmn:SequenceFlow') {
        console.log('Labeling element as part of hybrid program: ', elementOfCandidate);
        let element = viewElementRegistry.get(elementOfCandidate.id).businessObject;
        console.log('Found corresponding element in process view: ', element);
        element.$attrs['quantme:hybridRuntimeExecution'] = 'true';
        element.$attrs['quantme:hybridProgramId'] = 'hybridJob-' + hybridProgramId + '-activeTask';

        // first element of candidate is used to visualize process token while hybrid program is queued
        element.$attrs['quantme:hybridProgramEntryPoint'] = firstElement;
        firstElement = 'false';
      }
    }

    // store XML before rewriting to generate corresponding view
    console.log('Storing Xml from view modeler: ', viewModeler);
    const xml = await exportXmlWrapper(viewModeler);
    console.log('XML of workflow before rewriting: ', xml);

    // save XML in view dict
    modeler.views['view-before-rewriting'] = xml;
  }

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

  // add provenance specific attributes to service task
  if (provenanceCollectionEnabled) {
    invokeHybridRuntimeBo.$attrs['quantme:hybridRuntimeExecution'] = 'true';
    invokeHybridRuntimeBo.$attrs['quantme:hybridProgramId'] = 'hybridJob-' + hybridProgramId + '-activeTask';
  }

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

function exportXmlWrapper(modeler) {
  return new Promise((resolve) => {
    modeler.saveXML((err, successResponse) => {
      resolve(successResponse);
    });
  });
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
