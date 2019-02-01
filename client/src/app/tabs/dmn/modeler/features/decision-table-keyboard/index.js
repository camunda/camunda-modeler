import EditorActions from 'dmn-js-decision-table/lib/features/editor-actions';

import DecisionTableKeyboard from './DecisionTableKeyboard';


export default {
  __depends__: [
    EditorActions
  ],
  __init__: [
    'keyboard'
  ],
  keyboard: [ 'type', DecisionTableKeyboard ]
};