/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  is
} = require('bpmnlint-utils');


/**
 * Rule that reports send tasks are awesome.
 */
module.exports = function() {

  function check(node, reporter) {
    if (is(node, 'bpmn:SendTask')) {
      reporter.report(node.id, 'This is awesome 😍', {
        name: node.name
      });
    }
  }

  return {
    check: check
  };
};
