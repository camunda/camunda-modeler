'use strict';

var fs = require('fs'),
    path = require('path');

var ipc = require('ipc'),
    electron = require('app'),
    dialog = require('dialog');

var errorUtil = require('./util/error');

/**
 * General structure for the diagram's file as an object.
 *
 * @param  {String} filePath
 * @param  {String} file
 */
function createDiagramFile(filePath, file) {
  return {
    contents: file,
    name: path.basename(filePath),
    path: filePath
  };
}

/**
 * Interface for handling files.
 *
 * @param  {Object} browserWindow   Main browser window
 */
function FileSystem(browserWindow, config) {
  var self = this;

  this.browserWindow = browserWindow;
  this.config = config;
  this.encoding = { encoding: 'utf8' };


  ipc.on('file.save', function(evt, newDirectory, diagramFile) {
    self.save(newDirectory, diagramFile, function(err, updatedDiagram) {
      if (err) {
        return self.handleError('file.save.response', err);
      }

      browserWindow.webContents.send('file.save.response', null, updatedDiagram);
    });
  });

  ipc.on('file.open', function(evt) {
    self.open(function(err, diagramFile) {
      if (err) {
        return self.handleError('file.open.response', err);
      }

      browserWindow.webContents.send('file.open.response', null, diagramFile);
    });
  });

  ipc.on('file.close', function(evt, diagramFile) {
    self.close(diagramFile, function(err, updatedDiagram) {
      if (err) {
        return self.handleError('file.close.response', err);
      }

      browserWindow.webContents.send('file.close.response', null, updatedDiagram);
    });
  });
}

FileSystem.prototype.open = function(callback) {
  var self = this;

  this.showOpenDialog(function(filenames) {
    if (!filenames) {
      return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
    }

    self._open(filenames[0], callback);
  });
};

FileSystem.prototype._open = function(filePath, callback) {
  var browserWindow = this.browserWindow,
      self = this;

  if (path.extname(filePath) !== '.bpmn') {
    dialog.showErrorBox('Wrong file type', 'Please choose a .bpmn file!');

    this.open(function(err, diagramFile) {
      if (err) {
        return self.handleError('file.open.response', err);
      }
      browserWindow.webContents.send('file.open.response', null, diagramFile);
    });
    return;
  }

  fs.readFile(filePath, this.encoding, function(err, file) {
    var diagramFile = createDiagramFile(filePath, file);

    callback(err, diagramFile);
  });
};

FileSystem.prototype.save = function(newDirectory, diagramFile, callback) {
  var self = this;

  // Save as..
  if (newDirectory || diagramFile.path === '[unsaved]') {
    this.showSaveAsDialog(function(filename) {
      var extension = path.extname(filename);

      if (!filename) {
        return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
      }

      if (extension === '') {
        filename += '.bpmn';
      }

      self._save(filename, diagramFile, callback);
    });
  } else {
    this._save(diagramFile.path, diagramFile, callback);
  }
};

FileSystem.prototype._save = function(filePath, diagramFile, callback) {
  fs.writeFile(filePath, diagramFile.contents, this.encoding,  function(err) {
    var diagram = {
      name: path.basename(filePath),
      path: filePath
    };

    callback(err, diagram);
  });
};

FileSystem.prototype.close = function(diagramFile, callback) {
  var self = this;

  this.showCloseDialog(diagramFile.name, function(result) {
    if (result === 0) {
      return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
    }
    else if (result === 1) {
      return callback(null, diagramFile);
    }
    else {
      self.save(false, diagramFile, callback);
    }
  });
};

/**
 * Handle errors that the IPC has to deal with.
 *
 * @param  {String} event
 * @param  {Error} err
 */
FileSystem.prototype.handleError = function(event, err) {
  if (!errorUtil.isCancel(err)) {
    this.showGeneralErrorDialog();
  }
  this.browserWindow.webContents.send(event, errorUtil.normalizeError(err));
};

FileSystem.prototype.showOpenDialog = function(callback) {
  var config = this.config,
      defaultPath = config.get('defaultPath', electron.getPath('userDesktop'));

  dialog.showOpenDialog(this.browserWindow, {
      title: 'Open bpmn file',
      defaultPath: defaultPath,
      properties: [ 'openFile' ],
      filters: [
        { name: 'Bpmn', extensions: [ 'bpmn' ] }
      ]
    }, function(filenames) {
      if (filenames) {
        config.set('defaultPath', path.dirname(filenames[0]));
      }

      callback(filenames);
    });
};

FileSystem.prototype.showSaveAsDialog = function(callback) {
  dialog.showSaveDialog(this.browserWindow, {
      title: 'Save bpmn as..',
      filters: [
        { name: 'Bpmn', extensions: [ 'bpmn' ] }
      ]
    }, callback);
};

FileSystem.prototype.showCloseDialog = function(name, callback) {
  dialog.showMessageBox(this.browserWindow, {
      title: 'Close diagram',
      detail: 'Save changes to ' + name + ' before closing?',
      type: 'question',
      buttons: [ 'Cancel', 'Don\'t Save', 'Save' ]
    }, callback);
};

FileSystem.prototype.showGeneralErrorDialog = function() {
  dialog.showErrorBox('Error', 'There was an internal error.' + '\n' + 'Please try again.');
};

module.exports = FileSystem;
