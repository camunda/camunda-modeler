'use strict';

var slice = require('util/slice');

var inherits = require('inherits');

var format = require('format');

var Emitter = require('events');

var CATEGORIES = [ 'info', 'debug', 'warning', 'error' ];

var REF_PATTERN = /^ref\:/;


/**
 * Global logging facility, storing entries
 */
function Logger() {
  Emitter.call(this);

  this.entries = [];
}

inherits(Logger, Emitter);

module.exports = Logger;

Logger.prototype.clear = function() {
  this.entries.length = 0;

  this.emit('changed');
};


/**
 * Create methods for all defined categories
 */
CATEGORIES.forEach(function(category) {

  /**
   * Error, info or debug log something.
   *
   * @param {String} [ref]
   * @param {String} [format]
   */
  Logger.prototype[category] = function() {
    var args = slice(arguments);

    this.addEntry(category, args);

    this.emit('changed');
  };
});

Logger.prototype.addEntry = function(category, args) {

  var ref = args[0];

  if (REF_PATTERN.test(ref)) {
    ref = ref.replace(REF_PATTERN, '');

    args.shift();
  } else {
    ref = null;
  }

  var entry = {
    category: category,
    ref: ref,
    message: format.apply(null, args)
  };

  this.entries.push(entry);
};
