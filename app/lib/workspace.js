'use strict';

var forEach = require('lodash/collection/forEach');

var fs = require('fs');

var renderer = require('./util/renderer');


function Workspace(config) {

  renderer.on('workspace:restore', function(defaultConfig, done) {
    var tabs = [],
        workspace = config.get('workspace', null);

    if (!workspace) {
      return done(null, defaultConfig);
    }

    forEach(workspace.tabs, function(diagram) {
      try {
        var contents = fs.readFileSync(diagram.path, { encoding: 'utf8' });

        diagram.contents = contents;

        tabs.push(diagram);

        console.log('[workspace]', 'restore', diagram.path);
      } catch (err) {
        console.error('[workspace]', 'failed to restore file ', diagram.path, err);
      }
    });

    workspace.tabs = tabs;

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
