/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Nop, you aint gonna load this configuration.
 */
function NoneProvider() {

  this.get = function() {

    var key = arguments[0];
    var done = arguments[arguments.length - 1];

    return done(new Error('no provider for <' + key + '>'));
  };
}

module.exports = NoneProvider;