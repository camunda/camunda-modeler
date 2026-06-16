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
 * Registry-driven dispatch map.
 *
 * Maps `verb:resource` keys to framework command handlers. Mirrors c8ctl's
 * `src/command-dispatch.ts`. Adding a command means adding its handler here.
 */

const { getTopologyCommand } = require('./topology');
const {
  listProcessDefinitionsCommand,
  getProcessDefinitionCommand
} = require('./process-definitions');
const {
  listProcessInstancesCommand,
  searchProcessInstancesCommand,
  getProcessInstanceCommand,
  createProcessInstanceCommand,
  cancelProcessInstanceCommand
} = require('./process-instances');
const {
  listIncidentsCommand,
  getIncidentCommand,
  resolveIncidentCommand
} = require('./incidents');
const { publishMessageCommand } = require('./messages');
const { listProfileCommand, whichProfileCommand } = require('./profiles');
const { useProfileCommand, useTenantCommand } = require('./session');

/**
 * @type {Map<string, object>} keyed by "verb:resource"
 */
const COMMAND_DISPATCH = new Map([

  // topology
  [ 'get:topology', getTopologyCommand ],

  // process definitions
  [ 'list:process-definition', listProcessDefinitionsCommand ],
  [ 'get:process-definition', getProcessDefinitionCommand ],

  // process instances
  [ 'list:process-instance', listProcessInstancesCommand ],
  [ 'search:process-instance', searchProcessInstancesCommand ],
  [ 'get:process-instance', getProcessInstanceCommand ],
  [ 'create:process-instance', createProcessInstanceCommand ],
  [ 'cancel:process-instance', cancelProcessInstanceCommand ],

  // incidents
  [ 'list:incident', listIncidentsCommand ],
  [ 'get:incident', getIncidentCommand ],
  [ 'resolve:incident', resolveIncidentCommand ],

  // messages
  [ 'publish:message', publishMessageCommand ],

  // profiles (read) + session (in-memory)
  [ 'list:profile', listProfileCommand ],
  [ 'which:profile', whichProfileCommand ],
  [ 'use:profile', useProfileCommand ],
  [ 'use:tenant', useTenantCommand ]
]);

module.exports = {
  COMMAND_DISPATCH
};
