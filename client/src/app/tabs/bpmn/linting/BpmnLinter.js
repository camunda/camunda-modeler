/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import createBpmnLinter from '../../bpmn/linting/createBpmnLinter';

import config from '../../.bpmnlintrc';

import modelerModdle from 'modeler-moddle/resources/modeler.json';
import camundaModdle from 'camunda-bpmn-moddle/resources/camunda.json';

export default createBpmnLinter({
  config,
  moddleExtensions: {
    modeler: modelerModdle,
    camunda: camundaModdle
  }
});