/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getAllElementsByType } from '../parse';

import { getFormFields } from '../formHelpers';

export async function getUserTaskMetrics(file) {
  const userTasks = await getUserTasks(file);
  const userTaskFormMetrics = parseUserTaskForms(userTasks);
  const metrics = {
    count: userTasks.length,
    form: userTaskFormMetrics
  };

  return metrics;
}

async function getUserTasks(file) {
  const userTasks = await getAllElementsByType(file.contents, 'bpmn:UserTask');

  return userTasks;
}

function parseUserTaskForms(userTasks) {

  const hasFormField = (userTask) => !!(getFormFields(userTask).length);
  const hasFormKey = (userTask) => ('formKey' in userTask);
  const isEmbedded = (formKey) => formKey.startsWith('embedded:');
  const isExternal = (formKey) => formKey.startsWith('app:');
  const isOther = (formKey) => !isEmbedded(formKey) && !isExternal(formKey);

  return {
    count: userTasks.filter((userTask) => hasFormKey(userTask) || hasFormField(userTask)).length,
    embedded: userTasks.filter((userTask) => hasFormKey(userTask) && isEmbedded(userTask.formKey)).length,
    external: userTasks.filter((userTask) => hasFormKey(userTask) && isExternal(userTask.formKey)).length,
    generic: userTasks.filter((userTask) => !hasFormKey(userTask) && hasFormField(userTask)).length,
    other: userTasks.filter((userTask) => hasFormKey(userTask) && isOther(userTask.formKey)).length,
  };
}
