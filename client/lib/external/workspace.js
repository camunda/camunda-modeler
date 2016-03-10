'use strict';

var browser = require('util/browser');

/**
 * Workspace API used by app
 */
function Workspace() {

  /**
   * Saves an editor configuration.
   *
   * @param {Config} config
   * @param {Function} done
   */
  this.save = function(config, done) {
    browser.send('workspace:save', config, done);
  };

  /**
   * Load a previously saved workspace.
   *
   * The passed default result passed will be returned
   * if no workspace was saved previously.
   *
   * @param {Object} defaultResult
   * @param {Function} done
   */
  this.load = function(defaultResult, done) {
    browser.send('workspace:restore', defaultResult, done);
  };

}

module.exports = Workspace;
