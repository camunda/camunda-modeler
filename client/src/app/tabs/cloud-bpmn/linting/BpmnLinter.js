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

import modelerModdleSchema from 'modeler-moddle/resources/modeler.json';
import zeebeModdleSchema from 'zeebe-bpmn-moddle/resources/zeebe.json';

import { isString } from 'min-dash';

import linterConfig from '../../.bpmnlintrc';

import fullLinterConfig from '../../full.bpmnlintrc';

import {
  default as Flags,
  ENABLE_BPMNLINT_RECOMMENDED
} from '../../../../util/Flags';

const moddle = new BpmnModdle({
  modeler: modelerModdleSchema,
  zeebe: zeebeModdleSchema
});


export default class BpmnLinter {
  static async lint(contents) {

    const linter = new Linter(
      Flags.get(ENABLE_BPMNLINT_RECOMMENDED)
        ? fullLinterConfig
        : linterConfig
    );


    let rootElement;

    if (isString(contents)) {
      ({ rootElement } = await moddle.fromXML(contents));
    } else {
      rootElement = contents;
    }

    const results = await linter.lint(rootElement);

    console.log(results);

    return Object.values(results).reduce((results, result) => {
      return [ ...results, ...result ];
    }, []);
  }
}
