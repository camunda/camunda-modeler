'use strict';

var debug = require('debug')('events');

var inherits = require('inherits');

var EventEmitter = require('events');

var isArray = require('lodash/lang/isArray');

var slice = require('util/slice');


/**
 * The main hub for stuff happening inside an editor
 */
function Events() { }

inherits(Events, EventEmitter);

module.exports = Events;

/**
 * Compose a event emitting callback.
 *
 * @param {String|Array<String, args...>} event
 * @param {Object...} additialArguments
 *
 * @return {Function}
 */
Events.prototype.composeEmitter = function(event) {

  var args,
      self = this;

  // using varargs
  if (arguments.length > 1) {
    args = slice(arguments);
  } else {
    args = isArray(event) ? event : [ event ];
  }

  return function emit() {
    var realArgs = args.concat(slice(arguments));

    debug('invoke', realArgs);

    self.emit.apply(self, realArgs);
  };
};