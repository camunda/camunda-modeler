/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const {
  pathToFileURL,
  fileURLToPath
} = require('url');

function isFileUrl(value) {
  try {
    return new URL(value).protocol === 'file:';
  } catch (error) {
    return false;
  }
}

module.exports.isFileUrl = isFileUrl;

function isFilePath(value) {
  try {
    new URL(value);

    return false;
  } catch (error) {
    return true;
  }
}

module.exports.isFilePath = isFilePath;

function toFileUrl(value) {
  if (isFileUrl(value)) {
    return value;
  }

  return pathToFileURL(value).toString();
}

module.exports.toFileUrl = toFileUrl;

function toFilePath(value) {
  if (isFilePath(value)) {
    return value;
  }

  return fileURLToPath(value);
}

module.exports.toFilePath = toFilePath;

function getFileName(value) {
  return path.basename(value);
}

module.exports.getFileName = getFileName;

/**
 * Get the extension of a file, lower case (`.BPMN` is a BPMN file, as in the
 * client). A dot-prefixed name without further extension, e.g.
 * `.process-application`, is its own extension; one with an extension,
 * e.g. `.hidden.bpmn`, has that extension.
 *
 * @param { string } value
 *
 * @return { string }
 */
function getFileExtension(value) {
  const baseName = getFileName(value);

  const extension = path.extname(baseName);

  if (!extension && baseName.startsWith('.')) {
    return baseName;
  }

  return extension.toLowerCase();
}

module.exports.getFileExtension = getFileExtension;