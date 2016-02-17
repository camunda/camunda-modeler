'use strict';

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
    done(null, config);
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
    done(null, defaultResult);
  };

}

module.exports = Workspace;
