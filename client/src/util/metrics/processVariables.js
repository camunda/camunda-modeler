/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getProcessVariables } from '@bpmn-io/extract-process-variables';

import { getBpmnDefinitions } from '../parse';

export async function getProcessVariablesCount(file, type) {

  const {
    contents
  } = file;

  // ignore other engine profiles for now
  if (type !== 'bpmn') {
    return null;
  }

  const processVariables = [];

  const definitions = await getBpmnDefinitions(contents, type);

  const rootElements = definitions.get('rootElements');

  await Promise.all(
    rootElements.map(async (element) => {
      processVariables.push(...await getProcessVariables(element));
    })
  );

  return processVariables.length;
}
