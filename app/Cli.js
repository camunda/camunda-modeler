'use strict';

var fs = require('fs'),
    path = require('path');


/**
 * Parse file arguments from the command line
 * and return them as a list of paths.
 *
 * @param {Array<String>} args
 * @param {String} cwd
 */
function extractFiles(args, cwd) {

  var files = [],
      maybePath,
      idx;

  // parse command line from the end up to the first
  // command line switch, i.e. "--enable-logging" (or simply) "--"
  // camunda-modeler [arguments] -- fileA fileB ...
  for (idx = args.length - 1; idx > 1; idx--) {

    maybePath = args[idx];

    if (maybePath.startsWith('--')) {
      break;
    }

    maybePath = checkFile(maybePath, cwd);

    if (maybePath) {
      files.unshift(maybePath);
    }
  }

  return files;
}

module.exports.extractFiles = extractFiles;


/**
 * Check a possible file argument and return the absolute
 * path to it, if it is a file.
 *
 * @param {String} maybePath
 * @param {String} cwd
 */
function checkFile(maybePath, cwd) {

  var absolutePath = path.resolve(cwd, maybePath);

  if (fs.lstatSync(absolutePath).isFile()) {
    return absolutePath;
  } else {
    return null;
  }
}

module.exports.checkFile = checkFile;
