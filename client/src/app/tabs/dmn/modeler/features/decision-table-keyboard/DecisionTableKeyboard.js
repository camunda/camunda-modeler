/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Keyboard from 'dmn-js-decision-table/lib/features/keyboard/Keyboard';


export default class DecisionTableKeyboard extends Keyboard {
  constructor(decisionTable, ...superDependencies) {
    super(getKeyboardConfig(decisionTable), ...superDependencies);
  }
}

DecisionTableKeyboard.$inject = [
  'decisionTable',
  ...Keyboard.$inject.filter(dependency => dependency !== 'config.keyboard')
];

function getKeyboardConfig(decisionTable) {
  return {
    get bindTo() {
      return decisionTable._container;
    }
  };
}
