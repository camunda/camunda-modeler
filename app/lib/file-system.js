/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const fs = require('fs'),
      path = require('path');

const {
  assign,
  pick
} = require('min-dash');

const log = require('./log')('app:file-system');

const FILE_PROPERTIES = [
  'contents',
  'encoding',
  'fileType',
  'lastModified',
  'name',
  'path'
];

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';


/**
 * Read file.
 *
 * @param {string} filePath - Filepath.
 * @param {Object} [options] - Options.
 * @param {string|false} [options.encoding] - Encoding. Set to false to receive Buffer.
 *
 * @return {Object}
 */
module.exports.readFile = function(filePath, options = {}) {
  let { encoding } = options;

  if (!encoding && encoding !== false) {
    encoding = ENCODING_UTF8;
  }

  const fileContents = encoding ? fs.readFileSync(filePath, encoding) : fs.readFileSync(filePath);

  return createFile({
    path: filePath,
    contents: fileContents,
    lastModified: getLastModifiedTicks(filePath)
  });
};

/**
 * Read file stats for file.
 *
 * @param {Object} file - File.
 *
 * @return {FileDescriptor}
 */
module.exports.readFileStats = function(file) {
  const { path } = file;

  return createFile(file, {
    lastModified: getLastModifiedTicks(path)
  });
};

/**
 * Write file.
 *
 * @param {string} filePath - Filepath.
 * @param {Object} file - File.
 * @param {Object} [options] - Options.
 * @param {Object} [options.encoding] - Encoding.
 *
 * @return {Object}
 */
module.exports.writeFile = function(filePath, file, options = {}) {
  let { contents } = file;

  let {
    encoding,
    fileType
  } = options;

  if (!encoding) {
    encoding = ENCODING_UTF8;
  }

  if (encoding === ENCODING_BASE64) {
    contents = getBase64Contents(contents);
  }

  if (fileType) {
    filePath = ensureExtension(filePath, fileType);
  }

  file = createFile(file, {
    path: filePath
  });

  fs.writeFileSync(filePath, contents, encoding);

  return createFile(file, {
    lastModified: getLastModifiedTicks(filePath)
  });
};

// helpers //////////

/**
 * Return last modified for the given file path.
 *
 * @param {string} filePath - Filepath.
 *
 * @return {Integer}
 */
function getLastModifiedTicks(filePath) {
  try {
    const stats = fs.statSync(filePath);

    return stats.mtime.getTime() || 0;
  } catch (err) {
    log.error(`Unable to read lastModified of file "${ filePath }"`);

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
function createFile(oldFile, newFile) {
  if (!newFile) {
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
 * @param {string} filePath
 * @param {string} defaultExtension
 *
 * @return {string} filePath that definitely has an extension
 */
function ensureExtension(filePath, defaultExtension) {
  const extension = path.extname(filePath);

  return extension ? filePath : `${filePath}.${defaultExtension}`;
}

function getBase64Contents(contents) {
  return contents.replace(/^data:image\/(jpeg|png)+;base64,/, '');
}