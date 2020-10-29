/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModdle from 'bpmn-moddle';

import CamundaBpmnModdle from 'camunda-bpmn-moddle/resources/camunda';

import {
  getProcessVariables
} from '@bpmn-io/extract-process-variables';

export default async function(file) {
  const {
    contents
  } = file;

  const definitions = await parse(contents);

  const rootElement = getRootElement(definitions);

  return getProcessVariables(rootElement);
}

async function parse(xml) {
  const moddle = new BpmnModdle({
    camunda: CamundaBpmnModdle,
  });

  const { rootElement: definitions } = await moddle.fromXML(xml);

  return definitions;
}

function getRootElement(definitions) {
  return definitions.get('rootElements')[0];
}