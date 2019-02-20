/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
  forEach
} = require('min-dash');

const renderer = require('./util/renderer');

const log = require('./log')('app:workspace');


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
        log.info('restoring %s', path);

        files.push(fileSystem.readFile(path));

      } catch (err) {
        log.error('failed to restore %s', path, err);
      }
    });

    workspace.files = files;

    workspace.endpoints = workspace.endpoints || [];

    done(null, workspace);
  });

  renderer.on('workspace:save', function(workspace, done) {

    log.info('saving');

    config.set('workspace', workspace);

    done(null);
  });
}

module.exports = Workspace;
