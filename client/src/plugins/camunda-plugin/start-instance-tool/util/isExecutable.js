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

import {
  find
} from 'min-dash';

var moddle = new BpmnModdle();

export default function isExecutable(xml) {

  return new Promise(resolve => {
    moddle.fromXML(xml, function(err, definitions) {

      if (err) {
        return resolve(false);
      }

      const {
        rootElements
      } = definitions;

      const hasExecutableProcess = !!find(rootElements, r => r.isExecutable);

      resolve(hasExecutableProcess);

    });
  });

}