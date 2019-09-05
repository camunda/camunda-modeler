/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { readFile } = require('./file-system');

const renderer = require('./util/renderer');

const log = require('./log')('app:workspace');

const { forEach } = require('min-dash');


class Workspace {
  constructor(config) {
    renderer.on('workspace:restore', (defaultConfig, done) => {
      const workspace = config.get('workspace', null);

      if (!workspace) {
        return done(null, defaultConfig);
      }

      let files = [];

      // ensure backwards compatibility
      forEach((workspace.files || workspace.tabs), file => {
        const { path } = file;

        try {
          log.info(`restoring ${ path }`);

          files = [
            ...files,
            readFile(path)
          ];
        } catch (error) {
          log.error(`failed to restore ${ path }`, error);
        }
      });

      workspace.files = files;

      workspace.endpoints = workspace.endpoints || [];

      done(null, workspace);
    });

    renderer.on('workspace:save', (workspace, done) => {
      log.info('saving');

      config.set('workspace', workspace);

      done(null);
    });
  }
}

module.exports = Workspace;
