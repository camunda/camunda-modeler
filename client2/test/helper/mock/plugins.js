'use strict';

/**
 * Plugins Mock API used by app
 */
function Plugins() {

  /**
   * Mocked {Plugins#load}.
   */
  this.load = function(done) {
    done();
  };

  /**
   * Mocked {Plugins#getAll}.
   */
  this.getAll = function() {
    return [];
  };

  /**
   * Mocked {Plugins#get}.
   */
  this.get = function(type) {
    return [];
  };
}

module.exports = Plugins;
