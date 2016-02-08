'use strict';

var inherits = require('inherits');

var BaseWorkspace = require('../../../lib/external/workspace');

/**
 * Workspace Mock API used by app
 */
function Workspace() {
  BaseWorkspace.call(this);

  this.restoreSession = null;

  this.setSessionRestore = function() {
    this.restoreSession = this._session;
  };

  this.get = function() {
    return this._session;
  };

  this.restore = function(done) {
    this._session = this.restoreSession;

    done(null, this._session);
  };
}

inherits(Workspace, BaseWorkspace);

module.exports = Workspace;
