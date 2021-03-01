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

import { getDefinitions } from '../parse';

export async function getProcessVariablesCount(file, type) {

  const {
    contents
  } = file;

  // ignore other engine profiles for now
  if (type !== 'bpmn') {
    return 0;
  }

  const processVariables = [];

  const definitions = await getDefinitions(contents);

  const rootElements = definitions.get('rootElements');

  rootElements.forEach((element) => {
    processVariables.push(...getProcessVariables(element));
  });

  return processVariables.length;
}
