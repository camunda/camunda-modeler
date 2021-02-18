/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const { app } = require('electron');
const log = require('../../log')('app:qrm-manager');
const qrmHandler = require('./qrm-handler');
const repositoryConfig = require('./RepositoryConfig');

let QRMs = [];

/**
 * Get the local path to the folder in the repository containing the QRMs
 *
 * @return {string} the specified repository path
 */
module.exports.getQRMRepositoryPath = function() {
  if (repositoryConfig.githubRepositoryPath === undefined) {
    return '';
  }
  return repositoryConfig.githubRepositoryPath;
};

/**
 * Set the local path to the folder in the repository containing the QRMs
 *
 * @param repositoryPath the repository path
 */
module.exports.setQRMRepositoryPath = function(repositoryPath) {
  if (repositoryPath !== null && repositoryPath !== undefined) {
    repositoryConfig.githubRepositoryPath = repositoryPath;
    app.emit('menu:action', 'qrmRepoPathChanged', repositoryPath);
  }
};

/**
 * Get the repository name used to access the QRMs
 *
 * @return {string} the specified repository name
 */
module.exports.getQRMRepositoryName = function() {
  if (repositoryConfig.githubRepositoryName === undefined) {
    return '';
  }
  return repositoryConfig.githubRepositoryName;
};

/**
 * Set the repository name used to access the QRMs
 *
 * @param repositoryName the repository name
 */
module.exports.setQRMRepositoryName = function(repositoryName) {
  if (repositoryName !== null && repositoryName !== undefined) {
    repositoryConfig.githubRepositoryName = repositoryName;
    app.emit('menu:action', 'qrmRepoNameChanged', repositoryName);
  }
};

/**
 * Get the username used to access the QRM repository
 *
 * @return {string} the specified username
 */
module.exports.getQRMRepositoryUserName = function() {
  if (repositoryConfig.githubUsername === undefined) {
    return '';
  }
  return repositoryConfig.githubUsername;
};

/**
 * Set the username used to access the QRM repository
 *
 * @param userName the username
 */
module.exports.setQRMUserName = function(userName) {
  if (userName !== null && userName !== undefined) {
    repositoryConfig.githubUsername = userName;
    app.emit('menu:action', 'qrmUserNameChanged', userName);
  }
};

module.exports.getQRMs = function() {
  log.info('Retrieving QRMs from backend. Number of QRMs: %i', QRMs.length);
  return QRMs;
};

module.exports.updateQRMs = async function() {
  log.info('Updating QRMs in backend.');
  try {
    QRMs = await qrmHandler.getCurrentQRMs();
    return QRMs;
  } catch (error) {
    log.error('Error while updating QRMs in backend: ', error);
    throw error;
  }
};
