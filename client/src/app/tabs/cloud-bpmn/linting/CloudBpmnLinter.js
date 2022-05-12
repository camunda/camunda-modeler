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

import StaticResolver from 'bpmnlint/lib/resolver/static-resolver';

import { configs } from 'bpmnlint-plugin-camunda-compat';

import { isString } from 'min-dash';

import modelerModdle from 'modeler-moddle/resources/modeler.json';
import zeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';

import { adjustErrorMessages } from './utils/errorMessages';

const moddle = new BpmnModdle({
  modeler: modelerModdle,
  zeebe: zeebeModdle
});

export default class CloudBpmnLinter {
  static async lint(contents) {
    let rootElement;

    if (isString(contents)) {
      ({ rootElement } = await moddle.fromXML(contents));
    } else {
      rootElement = contents;
    }

    const executionPlatform = rootElement.get('modeler:executionPlatform'),
          executionPlatformVersion = rootElement.get('modeler:executionPlatformVersion');

    if (!executionPlatform || !executionPlatformVersion) {
      return [];
    }

    const configName = getConfigName(executionPlatform, executionPlatformVersion);

    const config = configs[ configName ];

    if (!config) {
      return [];
    }

    const rules = await importRules(config);

    const linter = new Linter({
      config: prefixRules(config),
      resolver: new StaticResolver(rules)
    });

    let reports = await linter.lint(rootElement);

    reports = adjustErrorMessages(reports, getExecutionPlatformLabel(executionPlatform, toSemverMinor(executionPlatformVersion)));

    return Object.values(reports).reduce((reports, report) => {
      return [ ...reports, ...report ];
    }, []);
  }
}

function getConfigName(executionPlatform, executionPlatformVersion) {
  return [
    ...executionPlatform.split(' ').map(toLowerCase),
    ...toSemverMinor(executionPlatformVersion).split('.')
  ].join('-');
}

function prefixRules({ rules }) {
  return {
    rules: Object.entries(rules).reduce((rules, [ key, value ]) => {
      return {
        ...rules,
        [ `bpmnlint-plugin-camunda-compat/${ key }` ]: value
      };
    }, {})
  };
}

async function importRules({ rules }) {
  let importedRules = {};

  for (let key of Object.keys(rules)) {
    const { default: importedRule } = await import(`bpmnlint-plugin-camunda-compat/rules/${ key }`);

    importedRules = {
      ...importedRules,
      [ `rule:bpmnlint-plugin-camunda-compat/${ key }` ]: importedRule
    };
  }

  return importedRules;
}

const executionPlatformLabels = {
  'Camunda Cloud': {
    '1.0': 'Camunda 8 (Zeebe 1.0)',
    '1.1': 'Camunda 8 (Zeebe 1.1)',
    '1.2': 'Camunda 8 (Zeebe 1.2)',
    '1.3': 'Camunda 8 (Zeebe 1.3)',
    '8.0': 'Camunda 8'
  }
};

function getExecutionPlatformLabel(executionPlatform, executionPlatformVersion) {
  return executionPlatformLabels[ executionPlatform ] && executionPlatformLabels[ executionPlatform ][ executionPlatformVersion ];
}

function toLowerCase(string) {
  return string.toLowerCase();
}

function toSemverMinor(executionPlatformVersion) {
  return executionPlatformVersion.split('.').slice(0, 2).join('.');
}