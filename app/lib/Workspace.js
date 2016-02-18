'use strict';

var forEach = require('lodash/collection/forEach');

var Ipc = require('electron').ipcMain;

var FileSystem = require('./FileSystem');


function Workspace(browserWindow, config) {
  this._workspace = {};

  Ipc.on('workspace.restore', function(evt) {
    var diagrams = [],
        workspace = config.get('workspace', null);

    if (!workspace) {
      return browserWindow.webContents.send('workspace.restore.response', new Error('Workspace is empty'));
    }

    forEach(workspace.diagrams, function(diagram) {
      try {
        diagrams.push(FileSystem.readDiagram(diagram.path));

        console.log('[workspace]', 'restore', diagram.path);
      } catch (err) {
        console.error('[workspace]', 'failed to restore file ', diagram.path, err);
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
