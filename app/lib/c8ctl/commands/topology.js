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
 * Topology command. Ported from c8ctl `src/commands/topology.ts`.
 */

const { defineCommand } = require('../framework');

const getTopologyCommand = defineCommand('get', 'topology', async (ctx) => {
  const result = await ctx.client.getTopology();

  return { kind: 'get', data: result };
});

module.exports = {
  getTopologyCommand
};
