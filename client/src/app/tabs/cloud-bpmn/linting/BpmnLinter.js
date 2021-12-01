/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { Linter } from 'bpmnlint';

import BpmnModdle from 'bpmn-moddle';

import StaticResolver from 'bpmnlint/lib/resolver/static-resolver';

import { isString } from 'min-dash';

import {
  camundaCloud10Rule,
  camundaCloud11Rule,
  camundaCloud12Rule,
  camundaCloud13Rule
} from './rules';

const linter = new Linter({
  resolver: new StaticResolver({
    'rule:bpmnlint-plugin-camunda-platform/camunda-cloud-1-0': camundaCloud10Rule,
    'rule:bpmnlint-plugin-camunda-platform/camunda-cloud-1-1': camundaCloud11Rule,
    'rule:bpmnlint-plugin-camunda-platform/camunda-cloud-1-2': camundaCloud12Rule,
    'rule:bpmnlint-plugin-camunda-platform/camunda-cloud-1-3': camundaCloud13Rule
  }),
  config: {
    rules: {
      'camunda-platform/camunda-cloud-1-0': 'error',
      'camunda-platform/camunda-cloud-1-1': 'error',
      'camunda-platform/camunda-cloud-1-2': 'error',
      'camunda-platform/camunda-cloud-1-3': 'error'
    }
  }
});

const moddle = new BpmnModdle();

export default class BpmnLinter {
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
}