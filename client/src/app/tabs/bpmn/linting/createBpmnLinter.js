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

import { Linter } from 'bpmnlint';

import { isString } from 'min-dash';


export default function createBpmnLinter({ config, moddleExtensions }) {
  const moddle = new BpmnModdle(moddleExtensions);

  const linter = new Linter(config);

  return class BpmnLinter {
    static async lint(contents) {
      let rootElement;

      if (isString(contents)) {
        ({ rootElement } = await moddle.fromXML(contents));
      } else {
        rootElement = contents;
      }

      const results = await linter.lint(rootElement);

      return Object.values(results).reduce((results, result) => {
        return [ ...results, ...result ];
      }, []);
    }
  };
}