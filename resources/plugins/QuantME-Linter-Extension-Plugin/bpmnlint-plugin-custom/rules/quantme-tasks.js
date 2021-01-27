/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

let QuantMEAttributeChecker = require('quantme/quantme/replacement/QuantMEAttributeChecker');

/**
 * Rule that reports QuantME tasks for which no suited replacement model exists
 */
module.exports = function() {

  function check(node, reporter) {
    if (node.$type && node.$type.startsWith('quantme:')) {
      if (!QuantMEAttributeChecker.requiredAttributesAvailable(node)) {
        reporter.report(node.id, 'Not all required attributes are set. Unable to replace task!');
        return;
      }
    }
  }

  return {
    check: check
  };
};
