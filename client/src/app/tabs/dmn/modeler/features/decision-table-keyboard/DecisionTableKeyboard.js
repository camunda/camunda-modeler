/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { inherits } from 'util';

import Keyboard from 'dmn-js-decision-table/lib/features/keyboard/Keyboard';


export default function DecisionTableKeyboard(injector, decisionTable) {
  injector.invoke(Keyboard, this, { 'config.keyboard': getKeyboardConfig(decisionTable) });
}

inherits(DecisionTableKeyboard, Keyboard);

DecisionTableKeyboard.$inject = [
  'injector',
  'decisionTable'
];

function getKeyboardConfig(decisionTable) {
  return {
    get bindTo() {
      return decisionTable._container;
    }
  };
}
