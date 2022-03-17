/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  isFunction
} from 'min-dash';

import {
  getAllElementsByType
} from '../parse';

import {
  getExtensionElements
} from '../extensionElementsHelpers';

export async function getServiceTaskMetrics(file, type) {
  const serviceTasks = await getServiceTasks(file, type);

  const parseServiceTasks = parseFormHandlers[type];

  let serviceTaskFormMetrics = {};

  if (isFunction(parseServiceTasks)) {
    serviceTaskFormMetrics = parseServiceTasks(serviceTasks);
  }

  const metrics = {
    count: serviceTasks.length,
    implementation: serviceTaskFormMetrics
  };

  return metrics;
}

async function getServiceTasks(file, type) {
  const serviceTasks = await getAllElementsByType(file.contents, 'bpmn:ServiceTask', type);

  return serviceTasks;
}

const parseFormHandlers = {
  'bpmn': parseCamundaServiceTasks,
  'cloud-bpmn': parseCloudServiceTasks
};


function parseCamundaServiceTasks(serviceTasks) {

  const isJava = (serviceTask) => 'class' in serviceTask;
  const isExpression = (serviceTask) => 'expression' in serviceTask;
  const isDelegate = (serviceTask) => 'delegateExpression' in serviceTask;
  const isExternal = (serviceTask) => 'type' in serviceTask && serviceTask.get('type') === 'external';
  const isConnector = (serviceTask) => getExtensionElements(serviceTask, 'camunda:Connector').length;

  return {
    count: serviceTasks.filter((serviceTask) => isJava(serviceTask) ||
                                                isExpression(serviceTask) ||
                                                isDelegate(serviceTask) ||
                                                isExternal(serviceTask) ||
                                                isConnector(serviceTask)).length,
    java: serviceTasks.filter(isJava).length,
    expression: serviceTasks.filter(isExpression).length,
    delegate: serviceTasks.filter(isDelegate).length,
    external: serviceTasks.filter(isExternal).length,
    connector: serviceTasks.filter(isConnector).length
  };
}

function parseCloudServiceTasks(serviceTasks) {

  const isImplemented = (serviceTask) => getExtensionElements(serviceTask, 'zeebe:TaskDefinition').length;

  return {
    count: serviceTasks.filter(isImplemented).length,
    external: serviceTasks.filter(isImplemented).length
  };
}
