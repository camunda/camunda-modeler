'use strict';

var fs = require('fs'),
    path = require('path');

var Ipc = require('ipc'),
    app = require('app'),
    browserOpen = require('./util/browser-open'),
    Dialog = require('dialog');

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


var FILE_ENCODING = { encoding: 'utf8' };

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
    self.browserWindow.webContents.send('editor.quit.response', null);

    return app.emit('editor:quit-allowed');
  });


  Ipc.on('editor.import.error', function(evt, diagramFile, trace) {
    self.handleImportError(diagramFile, trace, function(result) {
      self.browserWindow.webContents.send('editor.import.error.response', result);

      self.browserWindow.webContents.send('editor.actions', { event: 'editor.close' });
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

  var diagramFile;

  try {
    diagramFile = readDiagram(filePath);

    if (!diagramFile.notation) {
      self.showUnrecognizedFileDialog(diagramFile.name);

      return self.open(callback);
    }
  } catch (err) {
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
  var self = this,
      args = Array.prototype.slice.call(arguments);

  // Save as..
  if (newDirectory || diagramFile.path === '[unsaved]') {
    this.showSaveAsDialog(diagramFile, function(filePath) {

      if (!filePath) {
        return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
      }

      var saveFilePath = ensureExtension(filePath, diagramFile.notation);

      // display an additional override warning if
      // filePath.defaultExtension would override an existing file
      if (filePath !== saveFilePath && existsFile(saveFilePath)) {
        return self.showExistingFileDialog(path.basename(saveFilePath), function(result) {
          if (result === 0) {
            return self._save(saveFilePath, diagramFile, callback);
          } else {
            return self.save.apply(self, args);
          }
        });
      } else {
        // ok to save
        self._save(saveFilePath, diagramFile, callback);
      }
    });
  } else {
    this._save(diagramFile.path, diagramFile, callback);
  }
};

FileSystem.prototype._save = function(filePath, diagramFile, callback) {

  try {
    var newDiagramFile = writeDiagram(filePath, diagramFile);

    callback(null, newDiagramFile);
  } catch (err) {
    callback(err);
  }
};

FileSystem.prototype.close = function(diagramFile, callback) {
  var self = this;

  this.showCloseDialog(diagramFile.name, function(result) {
    if (result === 2) {
      return callback(new Error(errorUtil.CANCELLATION_MESSAGE));
    }
    else if (result === 1) {
      // omitting the diagram to indicate that
      // stuff was not saved...
      return callback(null);
    }
    else {
      self.save(null, diagramFile, callback);
    }
  });
};

FileSystem.prototype.handleImportError = function(diagramFile, trace, callback) {

  this.showImportErrorDialog(diagramFile.name, trace, function(answer) {
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

  var filePath = Dialog.showSaveDialog(this.browserWindow, opts);

  if (filePath) {
    config.set('defaultPath', path.dirname(filePath));
  }

  callback(filePath);
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

FileSystem.prototype.showImportErrorDialog = function(fileName, trace, callback) {
  var opts = {
    type: 'error',
    title: 'Importing Error',
    buttons: [ 'Close', 'Forum', 'Issue Tracker' ],
    message: 'Ooops, we could not display this diagram!',
    detail: [
      'Do you believe "' + fileName + '" is valid BPMN or DMN diagram?',
      'If so, please consult our forum or file an issue in our issue tracker.',
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

FileSystem.prototype.showExistingFileDialog = function(name, callback) {
  var opts = {
    type: 'warning',
    title: 'Existing file',
    buttons: [ 'Overwrite', 'Cancel' ],
    message: 'The file "' + name + '" already exists. Do you want to overwrite it ?'
  };

  callback(Dialog.showMessageBox(this.browserWindow, opts));
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
      '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
    ].join('\n'),
    noLink: true
  };

  callback(Dialog.showMessageBox(this.browserWindow, opts));
};

FileSystem.prototype.showGeneralErrorDialog = function() {
  Dialog.showErrorBox('Error', 'There was an internal error.' + '\n' + 'Please try again.');
};


module.exports = FileSystem;



function readDiagram(diagramPath) {

  var contents = fs.readFileSync(diagramPath, FILE_ENCODING);

  // trim leading and trailing whitespace
  // this fixes obscure import errors for non-strict
  // xml exports
  contents = contents.replace(/(^\s*|\s*$)/g, '');

  return createDiagramFile(diagramPath, contents);
}

module.exports.readDiagram = readDiagram;


var assign = require('lodash/object/assign');

function writeDiagram(diagramPath, diagramFile) {
  fs.writeFileSync(diagramPath, diagramFile.contents, FILE_ENCODING);

  return assign({}, diagramFile, {
    name: path.basename(diagramPath),
    path: diagramPath
  });
}

module.exports.writeDiagram = writeDiagram;


function existsFile(filePath) {
  try {
    fs.statSync(filePath);

    return true;
  } catch (e) {
    return false;
  }
}

module.exports.existsFile = existsFile;

/**
 * Ensure that the file path has an extension,
 * defaulting to defaultExtension if non is present.
 *
 * @param {String} filePath
 * @param {String} defaultExtension
 *
 * @return {String} filePath that definitely has an extension
 */
function ensureExtension(filePath, defaultExtension) {
  var extension = path.extname(filePath);

  return extension ? filePath : filePath + '.' + defaultExtension;
}

module.exports.ensureExtension = ensureExtension;