'use strict';

var fs = require('fs'),
    path = require('path');

var Ipc = require('ipc'),
    app = require('app'),
    dialog = require('dialog');

var errorUtil = require('./util/error');

var SUPPORTED_EXT_FILTER = [
  { name: 'All supported', extensions: [ 'bpmn', 'dmn' ] },
  { name: 'BPMN diagram', extensions: [ 'bpmn' ] },
  { name: 'DMN table', extensions: [ 'dmn' ] },
  { name: 'All files', extensions: [ '*' ] }
];

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
    type: path.extname(filePath).replace(/^\./, ''),
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


  Ipc.on('file.save', function(evt, newDirectory, diagramFile) {
    self.save(newDirectory, diagramFile, function(err, updatedDiagram) {
      if (err) {
        return self.handleError('file.save.response', err);
      }

      browserWindow.webContents.send('file.save.response', null, updatedDiagram);
    });
  });


  Ipc.on('file.open', function(evt) {
    self.open(function(err, diagramFile) {
      if (err) {
        return self.handleError('file.open.response', err);
      }

      browserWindow.webContents.send('file.open.response', null, diagramFile);
    });
  });


  Ipc.on('file.close', function(evt, diagramFile) {
    self.close(diagramFile, function(err, updatedDiagram) {
      if (err) {
        return self.handleError('file.close.response', err);
      }

      browserWindow.webContents.send('file.close.response', null, updatedDiagram);
    });
  });


  Ipc.on('editor.quit', function(evt, hasUnsavedChanges) {
    if (hasUnsavedChanges === false) {
      self.browserWindow.webContents.send('editor.quit.response', null);

      return app.emit('app-quit-allowed');
    }

    self.quit(function(err, answer) {
      if (err) {
        return self.handleError('editor.quit.response', err);
      }

      self.browserWindow.webContents.send('editor.quit.response', null, answer);

      if (answer === 'quit') {
        app.emit('app-quit-allowed');
      }
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
      self = this,
      extName = path.extname(filePath);

  if (!(/\.bpmn$|\.dmn$/.test(extName))) {
    dialog.showErrorBox('Wrong file type', 'Please choose a .bpmn or .dmn file!');

    this.open(function(err, diagramFile) {
      if (err) {
        return self.handleError('file.open.response', err);
      }
      browserWindow.webContents.send('file.open.response', null, diagramFile);
    });
    return;
  }

  this._openFile(filePath, callback);
};

FileSystem.prototype._openFile = function(filePath, callback) {
  fs.readFile(filePath, this.encoding, function(err, file) {
    var diagramFile = createDiagramFile(filePath, file);

    callback(err, diagramFile);
  });
};

FileSystem.prototype.addFile = function openFile(filePath) {
  var self = this,
      browserWindow = this.browserWindow;

  this._openFile(filePath, function(err, diagramFile) {
    if (err) {
      return self.showGeneralErrorDialog();
    }

    browserWindow.webContents.send('editor.actions', {
      event: 'file.add',
      data: {
        diagram: diagramFile
      }
    });
  });
};

FileSystem.prototype.save = function(newDirectory, diagramFile, callback) {
  var self = this;

  // Save as..
  if (newDirectory || diagramFile.path === '[unsaved]') {
    this.showSaveAsDialog(diagramFile.name, function(filename) {
      if (!filename) {
        return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
      }

      filename = self.sanitizeFilename(filename);

      self._save(filename, diagramFile, callback);
    });
  } else {
    this._save(diagramFile.path, diagramFile, callback);
  }
};

FileSystem.prototype._save = function(filePath, diagramFile, callback) {
  if (!callback) {
    return fs.writeFileSync(filePath, diagramFile.contents, this.encoding);
  }

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

FileSystem.prototype.quit = function(callback) {

  this.showQuitDialog(function(promptResult) {
    switch (promptResult) {
      case 'save':
        callback(null, 'save');
        break;
      case 'quit':
        callback(null, 'quit');
        break;
      default:
        callback(new Error(errorUtil.CANCELLATION_MESSAGE));
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
      defaultPath = config.get('defaultPath', app.getPath('userDesktop'));

  var opts = {
      title: 'Open diagram',
      defaultPath: defaultPath,
      properties: [ 'openFile' ],
      filters: SUPPORTED_EXT_FILTER
  };

  if (!callback) {
    return dialog.showOpenDialog(this.browserWindow, opts);
  }

  dialog.showOpenDialog(this.browserWindow, opts, function(filenames) {
    if (filenames) {
      config.set('defaultPath', path.dirname(filenames[0]));
    }

    callback(filenames);
  });
};

FileSystem.prototype.showSaveAsDialog = function(name, callback) {
  var config = this.config,
      defaultPath = config.get('defaultPath', app.getPath('userDesktop')),
      title;

  if (typeof name === 'function') {
    callback = name;
    name = 'diagram';
  }

  title = 'Save ' + name + ' as..';

  var opts = {
    title: title,
    filters: SUPPORTED_EXT_FILTER,
    defaultPath: defaultPath
  };

  if (!callback) {
    return dialog.showSaveDialog(this.browserWindow, opts);
  }

  dialog.showSaveDialog(this.browserWindow, opts, callback);
};

FileSystem.prototype.showCloseDialog = function(name, callback) {
  var opts = {
    title: 'Close diagram',
    message: 'Save changes to ' + name + ' before closing?',
    type: 'question',
    buttons: [ 'Cancel', 'Don\'t Save', 'Save' ]
  };

  if (!callback) {
    return dialog.showMessageBox(this.browserWindow, opts);
  }

  dialog.showMessageBox(this.browserWindow, opts, callback);
};

FileSystem.prototype.showQuitDialog = function(callback) {
  var opts = {
    title: 'Quit Modeler',
    message: 'You have some unsaved diagrams.' + '\n' + 'Do you want to save them before quitting ?',
    type: 'question',
    buttons: [ 'Yes', 'Quit', 'Cancel' ]
  };

  if (!callback) {
    return dialog.showMessageBox(this.browserWindow, opts);
  }

  dialog.showMessageBox(this.browserWindow, opts, function(result) {
    switch (result) {
      case 0:
        callback('save');
        break;
      case 1:
        callback('quit');
        break;
      default:
        callback('cancel');
    }
  });
};

FileSystem.prototype.showGeneralErrorDialog = function() {
  dialog.showErrorBox('Error', 'There was an internal error.' + '\n' + 'Please try again.');
};

FileSystem.prototype.sanitizeFilename = function(filename) {
  var extension = path.extname(filename);

  if (extension === '') {
    return filename + '.bpmn';
  }

  return filename;
};

module.exports = FileSystem;
