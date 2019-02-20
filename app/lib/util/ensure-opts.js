/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var {
  forEach,
  isNumber
} = require('min-dash');

var hasProperty = require('./has-property');


module.exports = function ensureOpts(expectedOptions, options) {

  if (typeof options !== 'object') {
    throw new Error('"options" must be an object');
  }

  var missingOptions = [];

  forEach(expectedOptions, function(value, key) {

    var name, details;

    // expectedOptions is an Array<String>
    if (isNumber(key)) {
      name = value;
    }
    // expectedOptions is an Object{String -> String}
    else {
      name = key;
      details = value;
    }

    if (!hasProperty(options, name)) {
      missingOptions.push(name + ': required' + (details ? '; ' + details : ''));
    }
  });

  if (missingOptions.length) {
    throw new Error('missing options\n\t' + missingOptions.join('\n\t'));
  }
};
