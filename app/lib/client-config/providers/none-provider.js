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