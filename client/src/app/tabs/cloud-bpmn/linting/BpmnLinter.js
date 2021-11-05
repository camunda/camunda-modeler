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

const moddle = new BpmnModdle();

const linter = new Linter({
  resolver: new StaticResolver({
    'rule:bpmnlint-plugin-camunda-platform/camunda-cloud-1-0': () => {
      return {
        check: (node, reporter) => {
          if (node.$instanceOf(node, 'bpmn:UserTask')) {
            reporter.report(node.id || node.$type, 'User task bad');
          }
        }
      };
    }
  }),
  config: {
    rules: {
      'camunda-platform/camunda-cloud-1-0': 'error'
    }
  }
});

export default class BpmnLinter {
  static async lint(contents) {
    let rootElement;

    if (isString(contents)) {
      ({ rootElement } = await moddle.fromXML(contents));
    } else {
      rootElement = contents;
    }

    const results = await linter.lint(rootElement);

    return Object.values(results).reduce((results, result) => [ ...results, ...result ], []);
  }
}