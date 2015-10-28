'use strict';

var fs = require('fs');

var forEach = require('lodash/collection/forEach');

var Ipc = require('ipc');


function Workspace(browserWindow, config) {
  this._workspace = {};

  Ipc.on('workspace.restore', function(evt) {
    var diagrams = [],
        workspace = config.get('workspace', null);

    if (!workspace) {
      return browserWindow.webContents.send('workspace.restore.response', new Error('Workspace is empty'));
    }

    forEach(workspace.diagrams, function(diagram) {
      var contents;

      try {
        contents = fs.readFileSync(diagram.path, { encoding: 'utf8' });

        diagram.contents = contents;

        diagrams.push(diagram);
      } catch (e) {
        contents = null;
      }
    });

    workspace.diagrams = diagrams;

    browserWindow.webContents.send('workspace.restore.response', null, workspace);
  });

  Ipc.on('workspace.save', function(evt, workspace) {

    config.set('workspace', workspace, function(err) {
      if (err) {
        return browserWindow.webContents.send('workspace.save.response', err);
      }
      browserWindow.webContents.send('workspace.save.response', null);
    });
  });
}

module.exports = Workspace;
