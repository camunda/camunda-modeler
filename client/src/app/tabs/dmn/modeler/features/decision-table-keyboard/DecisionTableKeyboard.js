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
