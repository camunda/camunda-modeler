/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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