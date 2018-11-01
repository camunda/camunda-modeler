'use strict';

var fs = require('fs'),
    path = require('path');

var {
  assign,
  pick,
  forEach
} = require('min-dash');

var ensureOptions = require('./util/ensure-opts');


var ENCODING_UTF8 = 'utf8';
var FILE_PROPERTIES = ['path', 'name', 'contents', 'lastModified', 'fileType'];

var NO_PATH_PROVIDED_ERROR = 'no path provided';


/**
 * Interface for handling files.
 *
 * @param {Object} options
 * @param {Dialog} options.dialog
 */
function FileSystem(options) {
  ensureOptions([ 'dialog' ], options);

  this.dialog = options.dialog;
}

module.exports = FileSystem;


FileSystem.prototype.open = function(filePath, callback) {
  var self = this,
      dialog = this.dialog,
      files = [];

  dialog.showDialog('open', { filePath: filePath }, function(err, filenames) {
    if (!filenames) {
      return callback(null);
    }

    forEach(filenames, function(filename, idx) {
      var file = self._openFile(filename);

      files.push(file);
    });

    callback(null, files);
  });
};


FileSystem.prototype._openFile = function(filePath, callback) {
  var diagramFile;

  try {
    diagramFile = this.readFile(filePath);
  } catch (err) {
    return err;
  }

  return diagramFile;
};

FileSystem.prototype.getFilePath = function(diagramFile) {
  return diagramFile.path !== '' ? diagramFile.path : null;
};

FileSystem.prototype.exportAs = function(diagramFile, filters, callback) {
  var dialog = this.dialog;

  var dialogOptions = {
    filePath: this.getFilePath(diagramFile),
    name: diagramFile.name.replace(/\.[^.]+$/, ''),
    filters
  };

  dialog.showDialog('exportAs', dialogOptions, function(err, filePath) {

    var savedFile;

    if (filePath) {

      let fileType = path.extname(filePath).replace(/^\./, '');

      // everything ok up to here -> we got a file
      savedFile = createFileDescriptor(diagramFile, {
        path: filePath,
        fileType
      });
    }

    callback(null, savedFile);
  });
};

// TODO(philippfromme): refactor, this method is highly confusing
FileSystem.prototype.saveAs = function(diagramFile, callback) {
  var dialog = this.dialog,
      self = this;

  var fileType = diagramFile.fileType;

  var dialogPath = { filePath: this.getFilePath(diagramFile) };

  // (3) handle dialog response
  function done(error, filePath) {

    // (4) call callback
    if (error) {
      return callback(error);
    }

    var savedFile = createFileDescriptor(diagramFile, {
      path: filePath
    });

    try {
      var newDiagramFile = self.writeFile(filePath, savedFile);

      callback(null, newDiagramFile);
    } catch (error) {
      callback(error);
    }
  }

  // (1) open save dialog
  dialog.showDialog('save', assign(createFileDescriptor({
    name: diagramFile.name,
    fileType: fileType
  }), dialogPath), function(error, filePath) {

    // (2) handle dialog response
    if (error) {
      return done(error);
    }

    // user cancelled on save as file dialog
    if (!filePath) {
      return done(new Error(NO_PATH_PROVIDED_ERROR));
    }

    filePath = ensureExtension(filePath, fileType);

    done(null, filePath);
  });
};


FileSystem.prototype.save = function(diagramFile, callback) {
  var filePath = diagramFile.path;

  try {
    var newDiagramFile = this.writeFile(filePath, diagramFile);

    callback(null, newDiagramFile);
  } catch (err) {
    callback(err);
  }
};


/**
 * Read a file.
 *
 * @param {String} filePath
 * @param {String} [encoding=utf8]
 *
 * @return {FileDescriptor}
 */
FileSystem.prototype.readFile = function(filePath, encoding) {

  encoding = encoding || ENCODING_UTF8;

  var fileContents = fs.readFileSync(filePath, encoding);

  // TODO(nikku): remove this behavior and move to client
  if (encoding === ENCODING_UTF8) {

    // trim leading and trailing whitespace
    // this fixes obscure import errors for non-strict
    // xml exports
    fileContents = fileContents.replace(/(^\s*|\s*$)/g, '');
  }

  return createFileDescriptor({
    path: filePath,
    contents: fileContents,
    lastModified: getLastModifiedTicks(filePath)
  });
};

/**
 * Return last modified for the given file path.
 *
 * @param {String} path
 *
 * @return {Integer}
 */
FileSystem.prototype.readFileStats = function(file) {
  return createFileDescriptor(file, {
    lastModified: getLastModifiedTicks(file.path)
  });
};



/**
 * Write a file.
 *
 * @param {String} filePath
 * @param {FileDescriptor} file
 *
 * @return {FileDescriptor} written file
 */
FileSystem.prototype.writeFile = function(filePath, file) {
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

  return createFileDescriptor(file, {
    lastModified: getLastModifiedTicks(filePath)
  });
};


/**
 * Return last modified for the given file path.
 *
 * @param {String} path
 *
 * @return {Integer}
 */
function getLastModifiedTicks(path) {
  try {
    var stats = fs.statSync(path);
    return stats.mtime.getTime() || 0;
  } catch (err) {
    console.error('Could not get file stats for the path: ' + path);
    return 0;
  }
}


/**
 * Create a file descriptor from optional old file and new file properties.
 * Assures only known properties are used.
 *
 * @param {FileDescriptor} oldFile
 * @param {FileDescriptor} newFile
 *
 * @return {FileDescriptor}
 */
function createFileDescriptor(oldFile, newFile) {
  // no old file supplied
  if (arguments.length == 1) {
    newFile = oldFile;
    oldFile = {};
  } else {
    oldFile = pick(oldFile, FILE_PROPERTIES);
  }

  newFile = pick(newFile, FILE_PROPERTIES);

  if (newFile.path) {
    newFile.name = path.basename(newFile.path);
  }

  return assign({}, oldFile, newFile);
}


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
