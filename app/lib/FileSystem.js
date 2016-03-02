'use strict';

var fs = require('fs'),
    path = require('path');

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');

var ensureOptions = require('./util/ensure-opts');


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
    path: filePath
  };
}

/**
 * Interface for handling files.
 *
 * @param  {Object} browserWindow   Main browser window
 */
function FileSystem(options) {
  ensureOptions([ 'dialog' ], options);

  this.dialog = options.dialog;
}

module.exports = FileSystem;


FileSystem.prototype.open = function(callback) {
  var self = this,
      dialog = this.dialog,
      files = [];

  var filenames = dialog.showDialog('open');

  if (!filenames) {
    return callback(null, 'cancel');
  }

  forEach(filenames, function(filename, idx) {
    var file = self._openFile(filename);

    if (!file.contents) {
      callback(file);

      return false;
    }

    files.push(file);
  });

  callback(null, files);
};


FileSystem.prototype._openFile = function(filePath) {
  var diagramFile;

  try {
    diagramFile = readFile(filePath);
  } catch (err) {
    return err;
  }

  return diagramFile;
};

FileSystem.prototype.addFile = function(filePath, callback) {
  var dialog = this.dialog;

  var diagramFile = this._openFile(filePath);

  if (!diagramFile.contents) {
    dialog.showGeneralErrorDialog();

    return callback(diagramFile);
  }

  callback(null, diagramFile);
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
  var filePath = diagramFile.path;

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
