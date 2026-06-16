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
 * Barrel for the c8ctl framework layer.
 */

const {
  COMMAND_REGISTRY,
  resolveVerb,
  resolveResource,
  getResourceDef,
  buildResourceAliasMap
} = require('./command-registry');
const {
  validateFlags,
  validatePositionals,
  detectUnknownFlags
} = require('./command-validation');
const {
  defineCommand,
  renderResult,
  isDefinedCommand,
  DEFINE_COMMAND_MARKER
} = require('./command-framework');

module.exports = {
  COMMAND_REGISTRY,
  resolveVerb,
  resolveResource,
  getResourceDef,
  buildResourceAliasMap,
  validateFlags,
  validatePositionals,
  detectUnknownFlags,
  defineCommand,
  renderResult,
  isDefinedCommand,
  DEFINE_COMMAND_MARKER
};
