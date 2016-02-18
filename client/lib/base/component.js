'use strict';

var debug = require('debug')('base-component');

var isFunction = require('lodash/lang/isFunction'),
    isArray = require('lodash/lang/isArray'),
    assign = require('lodash/object/assign');

var slice = require('util/slice');

var inherits = require('inherits');

var EventEmitter = require('events');


/**
 * A base component
 */
function BaseComponent(options) {
  EventEmitter.call(this);

  // apply properties
  assign(this, options);

  var self = this;

  /**
   * Compose a callback method
   *
   * @param {String|Array<String, args...>} action
   * @param {Object...} additialArguments
   *
   * @return {Function}
   */
  this.compose = function(action) {

    var args;

    // using varargs
    if (arguments.length > 1) {
      args = slice(arguments);
    } else
    if (!isArray(action)) {
      args = [ action ];
    } else {
      args = action;
    }

    var fn = args.shift();

    if (!isFunction(fn)) {

      if (!isFunction(self[fn])) {
        throw new Error('unknown action <' + fn + '>');
      }

      fn = self[fn];
    }

    return function actionHandler() {
      var realArgs = args.concat(slice(arguments));

      debug('invoke', realArgs);

      fn.apply(self, realArgs);
    };
  };
}

inherits(BaseComponent, EventEmitter);

module.exports = BaseComponent;
