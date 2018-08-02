'use strict';

import {
  forEach,
  isNumber
} from 'min-dash';

var hasProperty = require('./has-property');


module.exports = function ensureOpts(expectedOptions, options) {

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