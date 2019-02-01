'use strict';

const fs = require('fs');
const path = require('path');

const mri = require('mri');

/**
 * Parse file arguments from the command line
 * and return them as a list of paths.
 *
 * @param {Array<String>} args
 * @param {String} cwd
 *
 * @return {Object} parsed arguments as { files, flags }
 */
function parse(args, cwd) {

  const {
    _,
    ...flags
  } = mri(args.slice(1));

  const files = _.map(f => path.resolve(cwd, f)).filter(isFile);

  return {
    files,
    flags
  };
}

module.exports.parse = parse;


/**
 * Check a possible filePath represents an existing file.
 *
 * @param {String} filePath
 *
 * @return {Boolean}
 */
function isFile(filePath) {

  try {
    const stats = fs.lstatSync(filePath);

    if (stats.isFile()) {
      return true;
    }

    console.log('[cli] [WARN]', 'cannot open directory', filePath);
  } catch (e) {
    // file not found or the like...
    console.log('[cli] [WARN]', e.message, filePath);
  }

  return false;
}