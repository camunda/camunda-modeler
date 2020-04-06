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

const fs = require('fs');
const path = require('path');

const mri = require('mri');

const log = require('./log')('app:cli');

/**
 * Parse file arguments from the command line
 * and return them as a list of paths.
 *
 * @param {Array<string>} args
 * @param {string} cwd
 *
 * @return {Object} parsed arguments as { files, flags }
 */
function parse(args, cwd) {

  log.info('parsing %O in %O', args, cwd);

  const {
    _,
    ...flags
  } = mri(args.slice(1));

  const files = _.filter(isPath).map(f => path.resolve(cwd, f)).filter(isFile);

  return {
    files,
    flags
  };
}

module.exports.parse = parse;


function appendArgs(args, additionalArgs) {

  const allArgs = [
    ...args,
    ...additionalArgs
  ];

  const effectiveArgs = allArgs.reduce((effectiveArgs, arg) => {

    if (arg.startsWith('--no-')) {
      delete effectiveArgs[`--${arg.substring(5)}`];
    } else if (!arg.includes('=')) {
      delete effectiveArgs[`--no-${arg.substring(2)}`];
    }

    effectiveArgs[arg] = true;

    return effectiveArgs;
  }, {});

  return Object.keys(effectiveArgs);
}

module.exports.appendArgs = appendArgs;

/**
 * Check a possible filePath represents an existing file.
 *
 * @param {string} filePath
 *
 * @return {boolean}
 */
function isFile(filePath) {

  try {
    const stats = fs.lstatSync(filePath);

    if (stats.isFile()) {
      return true;
    }

    log.info('skipping directory %s', filePath);
  } catch (e) {

    // file not found or the like...
    log.info(e.message, filePath);
  }

  return false;
}


function isPath(path) {

  if (typeof path !== 'string') {
    log.info('skipping non-file arg %s', path);

    return false;
  }

  return true;
}