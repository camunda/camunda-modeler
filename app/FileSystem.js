'use strict';

var fs = require('fs'),
    path = require('path');

var Ipc = require('ipc'),
    app = require('app'),
    Dialog = require('dialog'),
    open = require('open');

var errorUtil = require('./util/error'),
    parseUtil = require('./util/parse');

var SUPPORTED_EXT = [ 'bpmn', 'dmn', 'xml' ];

var SUPPORTED_EXT_BPMN = { name: 'BPMN diagram', extensions: [ 'bpmn', 'xml' ] },
    SUPPORTED_EXT_DMN = { name: 'DMN table', extensions: [ 'dmn', 'xml' ] };

var SUPPORTED_EXT_FILTER = [
  { name: 'All supported', extensions: SUPPORTED_EXT },
  SUPPORTED_EXT_BPMN,
  SUPPORTED_EXT_DMN,
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
    notation: parseUtil.extractNotation(file),
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

      app.emit('editor:add-recent', updatedDiagram.path);

      browserWindow.webContents.send('file.save.response', null, updatedDiagram);
    });
  });

  Ipc.on('file.add', function(evt, path) {
    self.addFile(path);
  });

  Ipc.on('file.open', function(evt) {
    self.open(function(err, diagramFile) {
      if (err) {
        return self.handleError('file.open.response', err);
      }

      app.emit('editor:add-recent', diagramFile.path);

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

      return app.emit('editor:quit-allowed');
    }

    self.quit(function(err, answer) {
      if (err) {
        return self.handleError('editor.quit.response', err);
      }

      self.browserWindow.webContents.send('editor.quit.response', null, answer);
      if (answer === 'quit') {
        app.emit('editor:quit-allowed');
      }
    });
  });


  Ipc.on('editor.import.error', function(evt, trace) {
    self.handleImportError(trace, function(result) {
      self.browserWindow.webContents.send('editor.actions', { event: 'editor.close' });

      self.browserWindow.webContents.send('editor.import.error.response', result);
    });
  });
}

FileSystem.prototype.open = function(callback) {
  var self = this;

  this.showOpenDialog(function(filenames) {
    if (!filenames) {
      return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
    }

    self._openFile(filenames[0], callback);
  });
};

FileSystem.prototype._openFile = function(filePath, callback) {
  var self = this;

  fs.readFile(filePath, this.encoding, function(err, file) {

    var diagramFile = createDiagramFile(filePath, file);

    if (!diagramFile.notation) {
      Dialog.showMessageBox({
        type: 'warning',
        title: 'Unrecognized file format',
        buttons: [ 'Close' ],
        message: 'The file "' + diagramFile.name + '" is not a BPMN or DMN file.'
      });

      return self.open(callback);
    }

    callback(err, diagramFile);
  });
};

FileSystem.prototype.addFile = function(filePath) {
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
    this.showSaveAsDialog(diagramFile, function(filename) {
      if (!filename) {
        return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
      }

      filename = self.sanitizeFilename(filename, diagramFile.notation);

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

FileSystem.prototype.handleImportError = function(trace, callback) {

  this.showImportError(trace, function(answer) {
    switch (answer) {
      case 1:
        open('https://forum.bpmn.io/');
        callback('forum');
        break;
      case 2:
        open('https://github.com/bpmn-io/bpmn-js/issues');
        callback('tracker');
        break;
      default:
        callback('close');
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
    return Dialog.showOpenDialog(this.browserWindow, opts);
  }

  Dialog.showOpenDialog(this.browserWindow, opts, function(filenames) {
    if (filenames) {
      config.set('defaultPath', path.dirname(filenames[0]));
    }

    callback(filenames);
  });
};

FileSystem.prototype.showSaveAsDialog = function(diagramFile, callback) {
  var config = this.config,
      defaultPath = config.get('defaultPath', app.getPath('userDesktop'));

  var notation = diagramFile.notation,
      name = diagramFile.name,
      filters = [];

  if (notation === 'bpmn') {
    filters.push(SUPPORTED_EXT_BPMN);
  } else {
    filters.push(SUPPORTED_EXT_DMN);
  }

  var opts = {
    title: 'Save ' + name + ' as..',
    filters: filters,
    defaultPath: defaultPath
  };

  if (!callback) {
    return Dialog.showSaveDialog(this.browserWindow, opts);
  }

  Dialog.showSaveDialog(this.browserWindow, opts, callback);
};

FileSystem.prototype.showCloseDialog = function(name, callback) {
  var opts = {
    title: 'Close diagram',
    message: 'Save changes to ' + name + ' before closing?',
    type: 'question',
    buttons: [ 'Cancel', 'Don\'t Save', 'Save' ]
  };

  if (!callback) {
    return Dialog.showMessageBox(this.browserWindow, opts);
  }

  Dialog.showMessageBox(this.browserWindow, opts, callback);
};

FileSystem.prototype.showQuitDialog = function(callback) {
  var opts = {
    title: 'Quit Modeler',
    message: 'You have some unsaved diagrams.' + '\n' + 'Do you want to save them before quitting ?',
    type: 'question',
    buttons: [ 'Yes', 'Quit', 'Cancel' ]
  };

  if (!callback) {
    return Dialog.showMessageBox(this.browserWindow, opts);
  }

  Dialog.showMessageBox(this.browserWindow, opts, function(result) {
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

FileSystem.prototype.showImportError = function(trace, callback) {
  var opts = {
    type: 'error',
    title: 'Importing Error',
    buttons: [ 'Close', 'Forum', 'Issue Tracker' ],
    message: 'Ooops, we could not display the diagram!',
    detail: [
      'You believe your input is valid BPMN 2.0 XML ?',
      'Consult our forum or file an issue in our issue tracker.',
      '',
      trace
    ].join('\n')
  };

  if (!callback) {
    return Dialog.showMessageBox(this.browserWindow, opts);
  }

  Dialog.showMessageBox(this.browserWindow, opts, callback);
};

FileSystem.prototype.showGeneralErrorDialog = function() {
  Dialog.showErrorBox('Error', 'There was an internal error.' + '\n' + 'Please try again.');
};

FileSystem.prototype.sanitizeFilename = function(filename, notation) {
  var extension = path.extname(filename);

  if (extension === '') {
    return filename + '.' + notation;
  }

  return filename;
};

module.exports = FileSystem;
