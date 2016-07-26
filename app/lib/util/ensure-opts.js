'use strict';

var forEach = require('lodash/collection/forEach');

var isNumber = require('lodash/lang/isNumber');

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
