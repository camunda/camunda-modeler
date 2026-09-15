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

const path = require('path');
const fs = require('fs/promises');

const { expect } = require('@playwright/test');

const { fixture } = require('./paths');

/**
 * Copy a fixture diagram into a directory so tests never mutate the committed
 * fixture (opening + saving writes back to the file's own path).
 *
 * @param {string} name fixture file name, optionally in a subdirectory
 * @param {string} targetDir
 * @param {string} [as] target file name (defaults to the fixture's base name,
 *   so a nested fixture lands directly in `targetDir`)
 *
 * @return {Promise<string>} absolute path to the copy
 */
async function copyFixture(name, targetDir, as = path.basename(name)) {
  const target = path.join(targetDir, as);

  await fs.copyFile(fixture(name), target);

  return target;
}

/**
 * Copy a fixture directory (with its dotfiles) into a directory. Process
 * application fixtures are directories: the `.process-application` marker plus
 * the resources beside it, all of which the app's file context indexes.
 *
 * @param {string} name fixture directory name
 * @param {string} targetDir
 * @param {string} [as] target directory name (defaults to the fixture name)
 *
 * @return {Promise<string>} absolute path to the copy
 */
async function copyFixtureDir(name, targetDir, as = path.basename(name)) {
  const target = path.join(targetDir, as);

  await fs.cp(fixture(name), target, { recursive: true });

  return target;
}

/**
 * @param {string} filePath
 *
 * @return {Promise<string>}
 */
function readFile(filePath) {
  return fs.readFile(filePath, 'utf8');
}

/**
 * @param {string} filePath
 *
 * @return {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);

    return true;
  } catch {
    return false;
  }
}

/**
 * Count how many times a (global) pattern matches in `content` — handy for
 * asserting element counts in saved BPMN/DMN XML.
 *
 * @param {string} content
 * @param {RegExp} pattern a regex with the global flag
 *
 * @return {number}
 */
function countMatches(content, pattern) {
  return (content.match(pattern) || []).length;
}

/**
 * Wait until `filePath` is written to disk — the app saves asynchronously after
 * the save action, so the file appears a moment later. Fails the test if it
 * does not appear within the timeout.
 *
 * @param {string} filePath
 * @param {number} [timeout]
 *
 * @return {Promise<void>}
 */
async function expectFileExists(filePath, timeout = 10000) {
  await expect.poll(() => fileExists(filePath), { timeout }).toBe(true);
}

/**
 * Wait until the file at `filePath` contains `substring`. Tolerates the file
 * not existing yet (the save is asynchronous), so it can be awaited right after
 * triggering a save.
 *
 * @param {string} filePath
 * @param {string} substring
 * @param {number} [timeout]
 *
 * @return {Promise<void>}
 */
async function expectFileContains(filePath, substring, timeout = 10000) {
  await expect.poll(
    () => readFile(filePath).then(content => content.includes(substring)).catch(() => false),
    { timeout }
  ).toBe(true);
}

module.exports = {
  copyFixture,
  copyFixtureDir,
  readFile,
  fileExists,
  countMatches,
  expectFileExists,
  expectFileContains
};
