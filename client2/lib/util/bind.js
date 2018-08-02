'use strict';

var slice = require('./slice');


/**
 * Bind function arguments and return the bound function.
 *
 * @param {Array<Function, this, args...>} def
 *
 * @return {Function}
 */
module.exports = function bind(def) {

  if (arguments.length > 1) {
    def = arguments;
  }

  var args = slice(def);
  var fn = args.shift();

  return Function.prototype.bind.apply(fn, args);
};