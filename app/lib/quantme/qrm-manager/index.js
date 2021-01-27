/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const log = require('../../log')('app:qrm-manager');
const qrmHandler = require('./QRMHandler');
const repositoryConfig = require('./RepositoryConfig');

let QRMs = [];

/**
 * Get the repository name used to access the QRMs
 *
 * @return {string} the specified repository name
 */
module.exports.getQRMRepositoryName = function() {
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
  }
};

/**
 * Get the username used to access the QRM repository
 *
 * @return {string} the specified username
 */
module.exports.getQRMRepositoryUserName = function() {
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
  }
};

/**
 * Update the QRM repository configuration with the given username and repository name
 *
 * @param userName the Github username to which the QRM repository belongs
 * @param repoName the Github repository name to load the QRMs from
 */
module.exports.updateQRMRepositoryConfig = function(userName, repoName) {
  if (userName !== null && userName !== undefined) {
    repositoryConfig.githubUsername = userName;
  }
  if (repoName !== null && repoName !== undefined) {
    repositoryConfig.githubRepositoryName = repoName;
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
