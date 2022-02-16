/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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