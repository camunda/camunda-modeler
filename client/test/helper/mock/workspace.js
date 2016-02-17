'use strict';

/**
 * Workspace Mock API used by app
 */
function Workspace() {

  this.setSaved = function(workspace) {
    this.savedWorkspace = workspace;
  };

  this.getSaved = function(workspace) {
    return this.savedWorkspace;
  };

  /**
   * Mocked {Workspace#save}.
   */
  this.save = function(config, done) {
    this.setSaved(config);
    
    done(null, config);
  };

  /**
   * Mocked {Workspace#load}.
   */
  this.load = function(defaultResult, done) {
    var saved = this.getSaved();
    
    done(saved instanceof Error ? saved : null, saved || defaultResult);
  };
}

module.exports = Workspace;
