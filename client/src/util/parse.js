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
import parseExecutionPlatform from '../app/util/parseExecutionPlatform';


export async function getBpmnDefinitions(xml, diagramType) {

  const extensions = {
    modeler: ModelerModdle
  };

  if (diagramType === 'bpmn') {
    extensions.camunda = CamundaBpmnModdle;
  }

  if (diagramType === 'cloud-bpmn') {
    extensions.zeebe = ZeebeBpmnModdle;
  }

  const moddle = new BpmnModdle(extensions);

  const { rootElement: definitions } = await moddle.fromXML(xml);

  return definitions;
}


export async function getEngineProfile(xml, diagramType) {
  return {
    ...parseExecutionPlatform(xml)
  };
}

/**
 * Return all elements of a given type in a diagram,
 * and an empty array if none exist.
 *
 * @param {String} xml
 * @param {String} elementType
 * @param {String} diagramType
 *
 * @return {Array<Object>} a list of elements matching the type
 */
export async function getAllElementsByType(xml, elementType, diagramType) {
  const definitions = await getBpmnDefinitions(xml, diagramType);

  const processes = definitions.rootElements.filter((e) => is(e, 'bpmn:Process'));
  const elements = [];

  processes.forEach((process) => {
    const flowElements = selfAndAllFlowElements(process, false);
    elements.push(...flowElements.filter((flowElement) => is(flowElement, elementType)));
  });

  return elements;
}
