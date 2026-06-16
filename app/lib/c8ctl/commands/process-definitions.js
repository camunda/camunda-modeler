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
 * Process definition commands.
 * Ported from c8ctl `src/commands/process-definitions.ts`.
 */

const { defineCommand } = require('../framework');
const { fetchAllPages } = require('../core');

const listProcessDefinitionsCommand = defineCommand('list', 'process-definition', async (ctx) => {
  const filter = {
    filter: {
      ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {})
    }
  };

  const items = await fetchAllPages(
    (f, opts) => ctx.client.searchProcessDefinitions(f, opts),
    filter,
    undefined,
    ctx.limit
  );

  return {
    kind: 'list',
    items: items.map((pd) => ({
      Key: pd.processDefinitionKey,
      'Process ID': pd.processDefinitionId,
      Name: pd.name || '-',
      Version: pd.version,
      'Tenant ID': pd.tenantId
    })),
    emptyMessage: 'No process definitions found'
  };
});

const getProcessDefinitionCommand = defineCommand('get', 'process-definition', async (ctx, flags, args) => {
  const key = args.key;
  const consistency = { consistency: { waitUpToMs: 0 } };

  if (flags.xml) {
    const xml = await ctx.client.getProcessDefinitionXml({ processDefinitionKey: key }, consistency);

    return { kind: 'raw', content: xml };
  }

  const result = await ctx.client.getProcessDefinition({ processDefinitionKey: key }, consistency);

  return { kind: 'get', data: result };
});

module.exports = {
  listProcessDefinitionsCommand,
  getProcessDefinitionCommand
};
