'use strict';

var fs = require('fs'),
    path = require('path');

var Ipc = require('ipc'),
    app = require('app'),
    Dialog = require('dialog');

var browserOpen = require('open');

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
    self.save(newDirectory, diagramFile, function(err, updatedDiagram, isSaved) {
      if (err) {
        return self.handleError('file.save.response', err);
      }

      app.emit('editor:add-recent', updatedDiagram.path);

      browserWindow.webContents.send('file.save.response', null, updatedDiagram, isSaved);
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
    self.close(diagramFile, function(err, updatedDiagram, isSaved) {
      if (err) {
        return self.handleError('file.close.response', err);
      }

      browserWindow.webContents.send('file.close.response', null, updatedDiagram, isSaved);
    });
  });


  Ipc.on('editor.quit', function(evt, hasUnsavedChanges) {
    self.browserWindow.webContents.send('editor.quit.response', null);

    return app.emit('editor:quit-allowed');
  });


  Ipc.on('editor.import.error', function(evt, trace) {
    self.handleImportError(trace, function(result) {
      self.browserWindow.webContents.send('editor.actions', { event: 'editor.close' });

      self.browserWindow.webContents.send('editor.import.error.response', result);
    });
  });

  Ipc.on('editor.ready', function(evt) {
    app.emit('editor:ready');
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
      self.showUnrecognizedFileDialog(diagramFile.name);

      return self.open(callback);
    }

    if (err) {
      return callback(err);
    }

    if (parseUtil.hasActivitiURL(diagramFile.contents)) {

      self.showNamespaceDialog(function(answer) {
        if (answer === 0) {
          diagramFile.contents = parseUtil.replaceNamespace(diagramFile.contents);
        }

        callback(null, diagramFile);
      });
    } else {
      callback(null, diagramFile);
    }
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

    callback(err, diagram, true);
  });
};

FileSystem.prototype.close = function(diagramFile, callback) {
  var self = this;

  this.showCloseDialog(diagramFile.name, function(result) {
    if (result === 2) {
      return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
    }
    else if (result === 1) {
      return callback(null, diagramFile, false);
    }
    else {
      self.save(false, diagramFile, callback);
    }
  });
};

FileSystem.prototype.handleImportError = function(trace, callback) {

  this.showImportErrorDialog(trace, function(answer) {
    switch (answer) {
      case 1:
        browserOpen('https://forum.bpmn.io/');
        callback('forum');
        break;
      case 2:
        browserOpen('https://github.com/bpmn-io/bpmn-js/issues');
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
      defaultPath = config.get('defaultPath', app.getPath('userDesktop')),
      filenames;

  var opts = {
    title: 'Open diagram',
    defaultPath: defaultPath,
    properties: [ 'openFile' ],
    filters: SUPPORTED_EXT_FILTER,
    noLink: true
  };

  filenames = Dialog.showOpenDialog(this.browserWindow, opts);

  if (filenames) {
    config.set('defaultPath', path.dirname(filenames[0]));
  }

  callback(filenames);
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
    defaultPath: defaultPath,
    noLink: true
  };

  callback(Dialog.showSaveDialog(this.browserWindow, opts));
};

FileSystem.prototype.showCloseDialog = function(name, callback) {
  var opts = {
    title: 'Close diagram',
    message: 'Save changes to ' + name + ' before closing?',
    type: 'question',
    buttons: [ 'Save', 'Don\'t Save', 'Cancel' ],
    noLink: true
  };

  callback(Dialog.showMessageBox(this.browserWindow, opts));
};

FileSystem.prototype.showImportErrorDialog = function(trace, callback) {
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
    ].join('\n'),
    noLink: true
  };

  callback(Dialog.showMessageBox(this.browserWindow, opts));
};

FileSystem.prototype.showUnrecognizedFileDialog = function(name) {
  Dialog.showMessageBox({
    type: 'warning',
    title: 'Unrecognized file format',
    buttons: [ 'Close' ],
    message: 'The file "' + name + '" is not a BPMN or DMN file.',
    noLink: true
  });
};

FileSystem.prototype.showNamespaceDialog = function(callback) {
  var opts = {
    type: 'warning',
    title: 'Deprecated <activiti> namespace detected',
    buttons: [ 'Yes', 'No' ],
    message: 'Would you like to convert your diagram to the <camunda> namespace?',
    detail: [
      'This will allow you to maintain execution related properties.',
      '',
      '<camunda> namespace support works from Camunda BPM version 7.4.0, 7.3.3, 7.2.6 onwards.'
    ].join('\n'),
    noLink: true
  };

  callback(Dialog.showMessageBox(this.browserWindow, opts));
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
