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

import { exportXmlFromModeler, getCamundaInputOutput, getPropertiesToCopy, getRootProcess } from '../../Utilities';
import { getQuantMETasks, insertShape } from '../QuantMETransformator';
import {
  INVOKE_NISQ_ANALYZER_SCRIPT,
  INVOKE_TRANSFORMATION_SCRIPT, POLL_FOR_TRANSFORMATION_SCRIPT,
  RETRIEVE_FRAGMENT_SCRIPT_PREFIX,
  RETRIEVE_FRAGMENT_SCRIPT_SUFFIX,
  SELECT_ON_QUEUE_SIZE_SCRIPT
} from './HardwareSelectionScripts';
import * as consts from '../../Constants';
import extensionElementsHelper from 'bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper';
import { createModeler, createModelerFromXml } from '../ModelerGenerator';

/**
 * Replace the given QuantumHardwareSelectionSubprocess by a native subprocess orchestrating the hardware selection
 */
export async function replaceHardwareSelectionSubprocess(subprocess, parent, bpmnFactory, bpmnReplace, elementRegistry, modeling, nisqAnalyzerEndpoint, transformationFrameworkEndpoint, camundaEndpoint) {

  // replace QuantumHardwareSelectionSubprocess with traditional subprocess
  let element = bpmnReplace.replaceElement(elementRegistry.get(subprocess.id), { type: 'bpmn:SubProcess' });

  // update the properties of the new element
  modeling.updateProperties(element, getPropertiesToCopy(subprocess));
  modeling.updateProperties(element, { selectionStrategy : undefined, providers: undefined, simulatorsAllowed: undefined });

  // retrieve business object of the new element
  let bo = elementRegistry.get(element.id).businessObject;
  bo.di.isExpanded = true;

  // extract workflow fragment within the QuantumHardwareSelectionSubprocess
  let hardwareSelectionFragment = await getHardwareSelectionFragment(bo);

  // remove child elements from the subprocess
  bo.flowElements = [];

  // add start event for the new subprocess
  let startEvent = modeling.createShape({ type: 'bpmn:StartEvent' }, { x: 50, y: 50 }, element, {});
  let startEventBo = elementRegistry.get(startEvent.id).businessObject;
  startEventBo.name = 'Start Hardware Selection Subprocess';

  // add gateway to avoid multiple hardware selections for the same circuit
  let splittingGateway = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 50, y: 50 }, element, {});
  let splittingGatewayBo = elementRegistry.get(splittingGateway.id).businessObject;
  splittingGatewayBo.name = 'Hardware already selected?';

  // connect start event and gateway
  modeling.connect(startEvent, splittingGateway, { type: 'bpmn:SequenceFlow' });

  // add task to invoke the NISQ Analyzer and connect it
  let invokeHardwareSelection = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 50, y: 50 }, element, {});
  let invokeHardwareSelectionBo = elementRegistry.get(invokeHardwareSelection.id).businessObject;
  invokeHardwareSelectionBo.name = 'Invoke NISQ Analyzer';
  invokeHardwareSelectionBo.scriptFormat = 'groovy';
  invokeHardwareSelectionBo.script = INVOKE_NISQ_ANALYZER_SCRIPT;
  invokeHardwareSelectionBo.asyncBefore = true;

  // add NISQ Analyzer endpoint, providers attribute, and simulatorAllowed attribute as input parameters
  let invokeHardwareSelectionInOut = getCamundaInputOutput(invokeHardwareSelectionBo, bpmnFactory);
  nisqAnalyzerEndpoint += nisqAnalyzerEndpoint.endsWith('/') ? '' : '/';
  invokeHardwareSelectionInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'camunda_endpoint',
      value: camundaEndpoint
    })
  );
  invokeHardwareSelectionInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'nisq_analyzer_endpoint',
      value: nisqAnalyzerEndpoint + consts.NISQ_ANALYZER_QPU_SELECTION_PATH
    })
  );
  invokeHardwareSelectionInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'providers',
      value: subprocess.providers
    })
  );
  invokeHardwareSelectionInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'simulators_allowed',
      value: subprocess.simulatorsAllowed
    })
  );

  // connect gateway with selection path and add condition
  let selectionFlow = modeling.connect(splittingGateway, invokeHardwareSelection, { type: 'bpmn:SequenceFlow' });
  let selectionFlowBo = elementRegistry.get(selectionFlow.id).businessObject;
  selectionFlowBo.name = 'no';
  let selectionFlowCondition = bpmnFactory.create('bpmn:FormalExpression');
  selectionFlowCondition.body = '${execution.hasVariable("already_selected") == false || already_selected == false}';
  selectionFlowBo.conditionExpression = selectionFlowCondition;

  // add task implementing the defined selection strategy and connect it
  let selectionTask = addSelectionStrategyTask(subprocess.selectionStrategy, element, elementRegistry, modeling);
  if (selectionTask === undefined) {
    return false;
  }
  let selectionTaskBo = elementRegistry.get(selectionTask.id).businessObject;
  selectionTaskBo.asyncBefore = true;
  modeling.connect(invokeHardwareSelection, selectionTask, { type: 'bpmn:SequenceFlow' });

  // add task implementing the transformation of the QuantME modeling constructs within the QuantumHardwareSelectionSubprocess
  console.log('Adding extracted workflow fragment XML: ', hardwareSelectionFragment);
  let retrieveFragment = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 50, y: 50 }, element, {});
  let retrieveFragmentBo = elementRegistry.get(retrieveFragment.id).businessObject;
  retrieveFragmentBo.name = 'Retrieve Fragment to Transform';
  retrieveFragmentBo.scriptFormat = 'groovy';
  retrieveFragmentBo.script = RETRIEVE_FRAGMENT_SCRIPT_PREFIX + hardwareSelectionFragment + RETRIEVE_FRAGMENT_SCRIPT_SUFFIX;
  retrieveFragmentBo.asyncBefore = true;
  modeling.connect(selectionTask, retrieveFragment, { type: 'bpmn:SequenceFlow' });

  // add task implementing the transformation of the QuantME modeling constructs within the QuantumHardwareSelectionSubprocess
  let invokeTransformation = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 50, y: 50 }, element, {});
  let invokeTransformationBo = elementRegistry.get(invokeTransformation.id).businessObject;
  invokeTransformationBo.name = 'Invoke Transformation Framework';
  invokeTransformationBo.scriptFormat = 'groovy';
  invokeTransformationBo.script = INVOKE_TRANSFORMATION_SCRIPT;
  invokeTransformationBo.asyncBefore = true;
  modeling.connect(retrieveFragment, invokeTransformation, { type: 'bpmn:SequenceFlow' });

  // add Transformation Framework endpoint as input parameter
  let invokeTransformationInOut = getCamundaInputOutput(invokeTransformationBo, bpmnFactory);
  invokeTransformationInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'transformation_framework_endpoint',
      value: transformationFrameworkEndpoint
    })
  );
  invokeTransformationInOut.inputParameters.push(
    bpmnFactory.create('camunda:InputParameter', {
      name: 'camunda_endpoint',
      value: camundaEndpoint
    })
  );

  // add task to poll for the results of the transformation and deployment
  let pollForTransformation = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 50, y: 50 }, element, {});
  let pollForTransformationBo = elementRegistry.get(pollForTransformation.id).businessObject;
  pollForTransformationBo.name = 'Poll for Transformation and Deployment';
  pollForTransformationBo.scriptFormat = 'groovy';
  pollForTransformationBo.script = POLL_FOR_TRANSFORMATION_SCRIPT;
  pollForTransformationBo.asyncBefore = true;
  modeling.connect(invokeTransformation, pollForTransformation, { type: 'bpmn:SequenceFlow' });

  // join control flow
  let joiningGateway = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 50, y: 50 }, element, {});
  modeling.connect(pollForTransformation, joiningGateway, { type: 'bpmn:SequenceFlow' });

  // add connection from splitting to joining gateway and add condition
  let alreadySelectedFlow = modeling.connect(splittingGateway, joiningGateway, { type: 'bpmn:SequenceFlow' });
  let alreadySelectedFlowBo = elementRegistry.get(alreadySelectedFlow.id).businessObject;
  alreadySelectedFlowBo.name = 'yes';
  let alreadySelectedFlowCondition = bpmnFactory.create('bpmn:FormalExpression');
  alreadySelectedFlowCondition.body = '${execution.hasVariable("already_selected") == true && already_selected == true}';
  alreadySelectedFlowBo.conditionExpression = alreadySelectedFlowCondition;

  // add call activity invoking the dynamically transformed and deployed workflow fragment
  let invokeTransformedFragment = modeling.createShape({ type: 'bpmn:CallActivity' }, { x: 50, y: 50 }, element, {});
  let invokeTransformedFragmentBo = elementRegistry.get(invokeTransformedFragment.id).businessObject;
  invokeTransformedFragmentBo.name = 'Invoke Transformed Fragment';
  invokeTransformedFragmentBo.calledElement = '${fragment_endpoint}';
  invokeTransformedFragmentBo.calledElementBinding = 'latest';
  invokeTransformedFragmentBo.asyncBefore = true;
  modeling.connect(joiningGateway, invokeTransformedFragment, { type: 'bpmn:SequenceFlow' });

  // pass all variables between the caller and callee workflow
  let extensionElements = extensionElementsHelper.addEntry(invokeTransformedFragmentBo, invokeTransformedFragmentBo, bpmnFactory.create('camunda:In'), bpmnFactory)['extensionElements'];
  let invokeTransformedFragmentIn = extensionElements.values[0];
  let invokeTransformedFragmentOut = bpmnFactory.create('camunda:Out');
  extensionElements.values.push(invokeTransformedFragmentOut);
  invokeTransformedFragmentIn.variables = 'all';
  invokeTransformedFragmentOut.variables = 'all';
  invokeTransformedFragmentBo.extensionElements = extensionElements;

  // add end event for the new subprocess
  let endEvent = modeling.createShape({ type: 'bpmn:EndEvent' }, { x: 50, y: 50 }, element, {});
  let endEventBo = elementRegistry.get(endEvent.id).businessObject;
  endEventBo.name = 'Terminate Hardware Selection Subprocess';
  modeling.connect(invokeTransformedFragment, endEvent, { type: 'bpmn:SequenceFlow' });
  return true;
}

/**
 * Configure the given QuantME workflow fragment based on the selected hardware
 *
 * @param xml the QuantME workflow fragment in XML format
 * @param provider the provider of the selected QPU
 * @param qpu the selected QPU
 * @param circuitLanguage the language of the circuit provided by the NISQ Analyzer
 * @return the configured workflow model
 */
export async function configureBasedOnHardwareSelection(xml, provider, qpu, circuitLanguage) {
  let modeler = await createModelerFromXml(xml);
  let elementRegistry = modeler.get('elementRegistry');

  // get root element of the current diagram
  const rootElement = getRootProcess(modeler.getDefinitions());
  if (typeof rootElement === 'undefined') {
    console.log('Unable to retrieve root process element from definitions!');
    return { status: 'failed', cause: 'Unable to retrieve root process element from definitions!' };
  }
  rootElement.isExecutable = true;

  // get all QuantME modeling constructs from the process
  const quantmeTasks = getQuantMETasks(rootElement, elementRegistry);

  // update properties of quantum circuit execution and readout error mitigation tasks according to the hardware selection
  for (let quantmeTask of quantmeTasks) {
    console.log('Configuring task: ', quantmeTask.task);

    if (quantmeTask.task.$type === consts.QUANTUM_CIRCUIT_EXECUTION_TASK) {
      quantmeTask.task.provider = provider;
      quantmeTask.task.qpu = qpu;
      quantmeTask.task.programmingLanguage = circuitLanguage;
    }

    if (quantmeTask.task.$type === consts.READOUT_ERROR_MITIGATION_TASK) {
      quantmeTask.task.provider = provider;
      quantmeTask.task.qpu = qpu;
    }
  }

  return { status: 'success', xml: await exportXmlFromModeler(modeler) };
}

/**
 * Add and return a task implementing the given selection strategy
 */
function addSelectionStrategyTask(selectionStrategy, parent, elementRegistry, modeling) {
  console.log('Adding task for selection strategy: %s', selectionStrategy);

  if (selectionStrategy === undefined || !consts.SELECTION_STRATEGY_LIST.includes(selectionStrategy)) {
    console.log('Selection strategy not supported. Aborting!');
    return undefined;
  }

  switch (selectionStrategy) {
  case consts.SELECTION_STRATEGY_SHORTEST_QUEUE_SIZE:
    return addShortestQueueSelectionStrategy(parent, elementRegistry, modeling);
  default:
    console.log('Selection strategy not supported. Aborting!');
    return undefined;
  }
}

/**
 * Add a task implementing the Shortest-Queue selection strategy
 */
function addShortestQueueSelectionStrategy(parent, elementRegistry, modeling) {
  let task = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 50, y: 50 }, parent, {});
  let taskBo = elementRegistry.get(task.id).businessObject;
  taskBo.name = 'Selecting based on Queue Size';
  taskBo.scriptFormat = 'groovy';
  taskBo.script = SELECT_ON_QUEUE_SIZE_SCRIPT;
  return task;
}

async function getHardwareSelectionFragment(subprocess) {
  console.log('Extracting workflow fragment from subprocess: ', subprocess);

  // create new modeler to extract the XML of the workflow fragment
  let modeler = createModeler();
  let elementRegistry = modeler.get('elementRegistry');
  let bpmnReplace = modeler.get('bpmnReplace');
  let modeling = modeler.get('modeling');

  // initialize the modeler
  function initializeModeler() {
    return new Promise((resolve) => {
      modeler.createDiagram((err, successResponse) => {
        resolve(successResponse);
      });
    });
  }
  await initializeModeler();

  // retrieve root element to add extracted workflow fragment
  let rootElement = getRootProcess(modeler.getDefinitions());
  let rootElementBo = elementRegistry.get(rootElement.id);

  // add start and end event to the new process
  let startEvent = bpmnReplace.replaceElement(elementRegistry.get(rootElement.flowElements[0].id), { type: 'bpmn:StartEvent' });
  let endEvent = modeling.createShape({ type: 'bpmn:EndEvent' }, { x: 50, y: 50 }, rootElementBo, {});

  // insert given subprocess and connect to start and end event
  let insertedSubprocess = insertShape(rootElementBo, subprocess, {}, false, bpmnReplace, elementRegistry, modeling).element;
  modeling.connect(startEvent, insertedSubprocess, { type: 'bpmn:SequenceFlow' });
  modeling.connect(insertedSubprocess, endEvent, { type: 'bpmn:SequenceFlow' });

  // export xml and remove line breaks
  let xml = await exportXmlFromModeler(modeler);
  return xml.replace(/(\r\n|\n|\r)/gm, '');
}
