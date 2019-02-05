const {
  forEach
} = require('min-dash');

const renderer = require('./util/renderer');

const log = require('debug')('app:workspace');
const logError = require('debug')('app:workspace:error');


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
        log('restoring %s', path);

        files.push(fileSystem.readFile(path));

      } catch (err) {
        logError('failed to restore %s', path, err);
      }
    });

    workspace.files = files;

    workspace.endpoints = workspace.endpoints || [];

    done(null, workspace);
  });

  renderer.on('workspace:save', function(workspace, done) {

    log('saving');

    config.set('workspace', workspace);

    done();
  });
}

module.exports = Workspace;
