'use strict';

/**
 * Config API used by app
 */
function Config() {

  /**
   * Get a configuration entry by key.
   *
   * @param {String} key
   * @param {Object...} arguments
   * @param {Function} done callback
   */
  this.get = function(key) {

    // stub implementation right here...
    var done = arguments[arguments.length - 1];

    return done();
  };

}

module.exports = Config;