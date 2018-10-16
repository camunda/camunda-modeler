'use strict';

var AVAILABLE_REPLACE_ELEMENTS = [
  'replace-with-service-task',
  'replace-with-send-task',
  'replace-with-message-intermediate-catch',
  'replace-with-none-start',
  'replace-with-none-end',
  'replace-with-conditional-flow',
  'replace-with-default-flow',
  'replace-with-sequence-flow',
  'replace-with-parallel-gateway',
  'replace-with-exclusive-gateway',
  'replace-with-collapsed-subprocess',
  'replace-with-expanded-subprocess'
];

var AVAILABLE_CONTEXTPAD_ENTRIES = [
  'append.end-event',
  'append.gateway',
  'delete',
  'connect',
  'replace'
];

module.exports.AVAILABLE_REPLACE_ELEMENTS = AVAILABLE_REPLACE_ELEMENTS;

module.exports.AVAILABLE_CONTEXTPAD_ENTRIES = AVAILABLE_CONTEXTPAD_ENTRIES;	