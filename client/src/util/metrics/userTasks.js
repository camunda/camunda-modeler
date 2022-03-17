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
  getFormFields,
  getFormDefinition
} from '../formHelpers';

export async function getUserTaskMetrics(file, type) {
  const userTasks = await getUserTasks(file, type);

  const parseUserTaskForms = parseFormHandlers[type];

  let userTaskFormMetrics = {};

  if (isFunction(parseUserTaskForms)) {
    userTaskFormMetrics = parseUserTaskForms(userTasks);
  }

  const metrics = {
    count: userTasks.length,
    form: userTaskFormMetrics
  };

  return metrics;
}

async function getUserTasks(file, type) {
  const userTasks = await getAllElementsByType(file.contents, 'bpmn:UserTask', type);

  return userTasks;
}

const parseFormHandlers = {
  'bpmn': parseCamundaUserTaskForms,
  'cloud-bpmn': parseCloudUserTaskForms
};


function parseCamundaUserTaskForms(userTasks) {

  const hasFormField = (userTask) => !!(getFormFields(userTask).length);
  const hasFormKey = (userTask) => ('formKey' in userTask);
  const hasFormRef = (userTask) => ('formRef' in userTask);
  const isEmbedded = (formKey) => formKey.startsWith('embedded:');
  const isExternal = (formKey) => formKey.startsWith('app:');
  const isCamundaFormKey = (formKey) => formKey.startsWith('camunda-forms:');
  const isOther = (formKey) => !isEmbedded(formKey) && !isExternal(formKey) && !isCamundaFormKey(formKey);

  return {
    count: userTasks.filter((userTask) => hasFormKey(userTask) || hasFormField(userTask) || hasFormRef(userTask)).length,
    embedded: userTasks.filter((userTask) => hasFormKey(userTask) && isEmbedded(userTask.formKey)).length,
    external: userTasks.filter((userTask) => hasFormKey(userTask) && isExternal(userTask.formKey)).length,
    camundaForms: userTasks.filter((userTask) => ((hasFormKey(userTask) && isCamundaFormKey(userTask.formKey))
     || hasFormRef(userTask))).length,
    generated: userTasks.filter((userTask) => !hasFormKey(userTask) && hasFormField(userTask)).length,
    other: userTasks.filter((userTask) => hasFormKey(userTask) && isOther(userTask.formKey)).length,
  };
}

function parseCloudUserTaskForms(userTasks) {

  const hasFormDefinition = (userTask) => !!(getFormDefinition(userTask));
  const isCamundaForm = (formKey) => formKey.startsWith('camunda-forms:');
  const isOther = (formKey) => !isCamundaForm(formKey);

  return {
    count: userTasks.filter((userTask) => hasFormDefinition(userTask)).length,
    camundaForms: userTasks.filter((userTask) => hasFormDefinition(userTask) && isCamundaForm(getFormDefinition(userTask).formKey)).length,
    other: userTasks.filter((userTask) => hasFormDefinition(userTask) && isOther(getFormDefinition(userTask).formKey)).length,
  };
}
