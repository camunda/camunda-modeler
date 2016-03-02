'use strict';

var fs = require('fs'),
    path = require('path');

var assign = require('lodash/object/assign');

var app = require('electron').app;

var parseUtil = require('./util/parse'),
    renderer = require('./util/renderer'),
    ensureOptions = require('./util/ensure-opts');


var FILE_ENCODING = {
  encoding: 'utf8'
};

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
    fileType: parseUtil.extractNotation(file),
    path: filePath
  };
}

/**
 * Interface for handling files.
 *
 * @param  {Object} browserWindow   Main browser window
 */
function FileSystem(options) {
  var self = this;

  ensureOptions([ 'dialog' ], options);

  this.dialog = options.dialog;


  function saveCallback(saveAction, diagramFile, done) {
    saveAction.apply(self, [diagramFile,
      (err, updatedDiagram) => {
        if (err) {
          return done(err);
        }

        if (updatedDiagram !== 'cancel') {
          app.emit('editor:add-recent', updatedDiagram.path);
        }

        done(null, updatedDiagram);
      }
    ]);
  }

  renderer.on('file:save-as', function(diagramFile, done) {
    saveCallback(self.saveAs, diagramFile, done);
  });

  renderer.on('file:save', function(diagramFile, done) {
    saveCallback(self.save, diagramFile, done);
  });


  renderer.on('file:add', function(path, done) {
    self.addFile(path);

    done(null);
  });

  renderer.on('file:open', function(done) {
    self.open(function (err, diagramFile) {
      if (err) {
        return done(err);
      }

      app.emit('editor:add-recent', diagramFile.path);

      done(null, diagramFile);
    });
  });
}

module.exports = FileSystem;


FileSystem.prototype.open = function(callback) {
  var dialog = this.dialog;

  var filenames = dialog.showDialog('open');

  if (!filenames) {
    return callback(null, 'cancel');
  }

  self._openFile(filenames[0], callback);
};

FileSystem.prototype._openFile = function(filePath, callback) {
  var dialog = this.dialog;

  var diagramFile, answer;

  try {
    diagramFile = readFile(filePath);

    if (!diagramFile.fileType) {
      dialog.showDialog('unrecognizedFile', { name: diagramFile.name });

      return this.open(callback);
    }
  } catch (err) {
    return callback(err);
  }

  if (parseUtil.hasActivitiURL(diagramFile.contents)) {

    answer = dialog.showDialog('namespace');

    if (answer === 'yes') {
      diagramFile.contents = parseUtil.replaceNamespace(diagramFile.contents);
    }

    callback(null, diagramFile);
  } else {
    callback(null, diagramFile);
  }
};

FileSystem.prototype.addFile = function(filePath) {
  var dialog = this.dialog;

  this._openFile(filePath, function (err, diagramFile) {
    if (err) {
      return dialog.showGeneralErrorDialog();
    }

    renderer.send('editor.actions', {
      event: 'file.add',
      data: {
        diagram: diagramFile
      }
    });
  });
};

FileSystem.prototype.saveAs = function(diagramFile, callback) {
  var dialog = this.dialog,
      answer;

  var filePath = dialog.showDialog('save', { name: diagramFile.name, fileType: diagramFile.fileType });

  if (!filePath) {
    return callback(null, 'cancel');
  }

  var saveFilePath = ensureExtension(filePath, diagramFile.fileType);

  // display an additional override warning if
  // filePath.defaultExtension would override an existing file
  if (filePath !== saveFilePath && existsFile(saveFilePath)) {
    answer = dialog.showDialog('existingFile', { name: diagramFile.name });

    if (answer !== 'overwrite') {
      return callback(null, answer);
    }
  }

  callback(null, assign(diagramFile, {
    path: saveFilePath
  }));
};

FileSystem.prototype.save = function(diagramFile, callback) {
  this._save(diagramFile.path, diagramFile, callback);
};

FileSystem.prototype._save = function(filePath, diagramFile, callback) {
  console.log('--->', filePath);

  try {
    var newDiagramFile = writeFile(filePath, diagramFile);

    callback(null, newDiagramFile);
  } catch (err) {
    callback(err);
  }
};


function readFile(diagramPath) {

  var contents = fs.readFileSync(diagramPath, FILE_ENCODING);

  // trim leading and trailing whitespace
  // this fixes obscure import errors for non-strict
  // xml exports
  contents = contents.replace(/(^\s*|\s*$)/g, '');

  return createDiagramFile(diagramPath, contents);
}

module.exports.readFile = readFile;



function writeFile(diagramPath, diagramFile) {
  fs.writeFileSync(diagramPath, diagramFile.contents, FILE_ENCODING);

  return assign({}, diagramFile, {
    name: path.basename(diagramPath),
    path: diagramPath
  });
}

module.exports.writeFile = writeFile;


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
