'use strict';

var {
  forEach
} = require('min-dash');

var renderer = require('./util/renderer');


function Workspace(config, fileSystem) {

  renderer.on('workspace:restore', function(defaultConfig, done) {
    var files = [],
        workspace = config.get('workspace', null);

    if (!workspace) {
      return done(null, defaultConfig);
    }

    // ensure backwards compatibility
    forEach((workspace.files || workspace.tabs), function(diagram) {
      const {
        path
      } = diagram;

      try {
        files.push(fileSystem.readFile(path));

        console.log('[workspace]', 'restore', path);
      } catch (err) {
        console.error('[workspace]', 'failed to restore file ', path, err);
      }
    });

    workspace.files = files;

    workspace.endpoints = workspace.endpoints || [];

    done(null, workspace);
  });

  renderer.on('workspace:save', function(workspace, done) {

    config.set('workspace', workspace, function(err) {
      if (err) {
        return done(err);
      }

      console.log('[workspace]', 'save');

      done(null);
    });
  });
}

module.exports = Workspace;
