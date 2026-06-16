/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Barrel for the c8ctl core layer.
 *
 * Mirrors c8ctl's layering: core depends only on core; framework and commands
 * import core exclusively through this barrel.
 */

const { Logger, isRecord, sanitizeForLogging } = require('./logger');
const { CommandError, normalizeToError, handleCommandError } = require('./errors');
const {
  Config,
  TARGET_TYPES,
  AUTH_TYPES,
  MODELER_PREFIX,
  getUserDataDir,
  getModelerDataDir,
  connectionToClusterConfig,
  connectionToProfile,
  profileToClusterConfig
} = require('./config');
const {
  createClient,
  fetchAllPages,
  DEFAULT_PAGE_SIZE,
  DEFAULT_MAX_ITEMS
} = require('./client');

module.exports = {
  Logger,
  isRecord,
  sanitizeForLogging,
  CommandError,
  normalizeToError,
  handleCommandError,
  Config,
  TARGET_TYPES,
  AUTH_TYPES,
  MODELER_PREFIX,
  getUserDataDir,
  getModelerDataDir,
  connectionToClusterConfig,
  connectionToProfile,
  profileToClusterConfig,
  createClient,
  fetchAllPages,
  DEFAULT_PAGE_SIZE,
  DEFAULT_MAX_ITEMS
};
