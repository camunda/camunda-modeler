'use strict';

var fs = require('fs'),
    path = require('path');

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');

var ensureOptions = require('./util/ensure-opts');


var ENCODING_UTF8 = 'utf8';


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


/**
 * Create a file descriptor from a given path
 * and the files contents.
 *
 * @param {String} filePath
 * @param {String} fileContents
 *
 * @return {FileDescriptor}
 */
function createFileDescriptor(filePath, fileContents) {
  return {
    contents: fileContents,
    name: path.basename(filePath),
    path: filePath
  };
}

/**
 * Read a file.
 *
 * @param {String} filePath
 * @param {String} [encoding=utf8]
 *
 * @return {FileDescriptor}
 */
function readFile(filePath, encoding) {

  encoding = encoding || ENCODING_UTF8;

  var fileContents = fs.readFileSync(filePath, encoding);

  // TODO(nikku): remove this behavior and move to client
  if (encoding === ENCODING_UTF8) {

    // trim leading and trailing whitespace
    // this fixes obscure import errors for non-strict
    // xml exports
    fileContents = fileContents.replace(/(^\s*|\s*$)/g, '');
  }

  return createFileDescriptor(filePath, fileContents);
}

module.exports.readFile = readFile;


/**
 * Write a file.
 *
 * @param {String} filePath
 * @param {FileDescriptor} file
 *
 * @return {FileDescriptor} written file
 */
function writeFile(filePath, file) {
  var contents = file.contents,
      encoding;

  var match = /^data:(image\/[^;]+);base64,(.*)$/.exec(contents);

  if (match) {
    encoding = 'base64';
    contents = match[2];
  } else {
    encoding = ENCODING_UTF8;
  }

  fs.writeFileSync(filePath, contents, encoding);

  return assign({}, file, {
    name: path.basename(filePath),
    path: filePath
  });
}

module.exports.writeFile = writeFile;


/**
 * Check whether a file exists.
 *
 * @param {String} filePath
 *
 * @return {Boolean}
 */
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
