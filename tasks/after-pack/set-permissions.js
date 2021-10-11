/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

const FILE_PERMISSIONS = 0o664;
const EXEC_FILE_PERMISSIONS = 0o775;
const DIR_PERMISSIONS = 0o755;

module.exports = function(context) {
  const {
    appOutDir
  } = context;

  const flatten = (lists) =>
    lists.reduce((a, b) => a.concat(b), []);

  const getDirectories = (srcpath) =>
    fs.readdirSync(srcpath)
      .map(file => path.join(srcpath))
      .filter(path => fs.statSync(path).isDirectory());

  const getFiles = (srcpath) =>
    fs.readdirSync(srcpath)
      .map(file => path.join(srcpath, file))
      .filter(path => !fs.statSync(path).isDirectory());

  const getDirectoriesRecursive = (srcpath) =>
    [
      srcpath,
      ...flatten(getDirectories(srcpath)
        .map(getDirectoriesRecursive))
    ];

  // get list of directories and files recursively
  const dirs = getDirectoriesRecursive(appOutDir);
  let files = dirs.map(dir => getFiles(dir));
  files = flatten(files);

  // TODO: get list of executable files
  const execFiles = [];

  // change perms for files
  files.forEach((filename) => {
    fs.chmodSync(filename, FILE_PERMISSIONS);
  });

  // change perms for directories
  dirs.forEach((dirname) => {
    fs.chmodSync(dirname, DIR_PERMISSIONS);
  });

  // change executable file permissions
  execFiles.forEach((filename) => {
    fs.chmodSync(filename, EXEC_FILE_PERMISSIONS);
  });

};

