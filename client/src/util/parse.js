/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { is } from 'bpmn-js/lib/util/ModelUtil';

import BpmnModdle from 'bpmn-moddle';

import CamundaBpmnModdle from 'camunda-bpmn-moddle/resources/camunda';
import ZeebeBpmnModdle from 'zeebe-bpmn-moddle/resources/zeebe';
import ModelerModdle from 'modeler-moddle/resources/modeler';

import { selfAndAllFlowElements } from './elementsUtil';


export async function getDefinitions(xml) {
  const moddle = new BpmnModdle({
    camunda: CamundaBpmnModdle,
    zeebe: ZeebeBpmnModdle,
    modeler: ModelerModdle
  });

  const { rootElement: definitions } = await moddle.fromXML(xml);

  return definitions;
}

export async function getEngineProfile(xml) {
  const definition = await getDefinitions(xml);

  return {
    executionPlatform: definition.get('executionPlatform'),
    executionPlatformVersion: definition.get('executionPlatformVersion')
  };
}

/**
 * Return all elements of a given type in a diagram,
 * and an empty array if none exist.
 *
 * @param {String} xml
 * @param {String} type
 *
 * @return {Array<Object>} a list of elements matching the type
 */
export async function getAllElementsByType(xml, type) {
  const definitions = await getDefinitions(xml);

  const processes = definitions.rootElements.filter((e) => is(e, 'bpmn:Process'));
  const elements = [];

  processes.forEach((process) => {
    const flowElements = selfAndAllFlowElements(process, false);
    elements.push(...flowElements.filter((flowElement) => is(flowElement, type)));
  });

  return elements;
}