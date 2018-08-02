'use strict';

/* global sinon:false */

/**
 * Spy on all public API (i.e. non _... methods) of an object.
 *
 * @param {Object} object
 *
 * @return {Function} spy reset function
 */
module.exports = function spyOn(object) {

  var spies = [];

  Object.keys(object).forEach(function(key) {

    var value = object[key];

    if (/^_/.test(key) || typeof value !== 'function') {
      return;
    }

    value = object[key] = sinon.spy(value);

    spies.push(value);
  });

  return function() {
    spies.forEach(function(s) {
      s.reset();
    });
  };
};