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
 * Process instance commands.
 * Ported from c8ctl `src/commands/process-instances.ts`.
 */

const { defineCommand } = require('../framework');
const { fetchAllPages } = require('../core');

/**
 * Build the search filter shared by `list` and `search` process-instance.
 *
 * @param {object} ctx
 * @param {object} flags
 * @param { { defaultActiveState?: boolean } } [opts]
 * @returns {object}
 */
function buildProcessInstanceFilter(ctx, flags, opts = {}) {
  const filter = {
    filter: {
      ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {})
    }
  };

  if (flags.id) {
    filter.filter.processDefinitionId = flags.id;
  }

  if (flags.state) {
    filter.filter.state = flags.state;
  } else if (opts.defaultActiveState && !flags.all) {
    filter.filter.state = 'ACTIVE';
  }

  return filter;
}

/**
 * Map a process instance to a display row.
 *
 * @param {object} pi
 * @returns {object}
 */
function toRow(pi) {
  return {
    Key: `${pi.hasIncident ? '⚠ ' : ''}${pi.processInstanceKey}`,
    'Process ID': pi.processDefinitionId,
    State: pi.state,
    Version: pi.processDefinitionVersion,
    'Start Date': pi.startDate || '-',
    'Tenant ID': pi.tenantId
  };
}

const listProcessInstancesCommand = defineCommand('list', 'process-instance', async (ctx, flags) => {
  const filter = buildProcessInstanceFilter(ctx, flags, { defaultActiveState: true });

  const items = await fetchAllPages(
    (f, opts) => ctx.client.searchProcessInstances(f, opts),
    filter,
    undefined,
    ctx.limit
  );

  return {
    kind: 'list',
    items: items.map(toRow),
    emptyMessage: 'No process instances found'
  };
});

const searchProcessInstancesCommand = defineCommand('search', 'process-instance', async (ctx, flags) => {
  const filter = buildProcessInstanceFilter(ctx, flags);

  const items = await fetchAllPages(
    (f, opts) => ctx.client.searchProcessInstances(f, opts),
    filter,
    undefined,
    ctx.limit
  );

  return {
    kind: 'list',
    items: items.map(toRow),
    emptyMessage: 'No process instances found'
  };
});

const getProcessInstanceCommand = defineCommand('get', 'process-instance', async (ctx, flags, args) => {
  const key = args.key;
  const consistency = { consistency: { waitUpToMs: 0 } };

  const result = await ctx.client.getProcessInstance({ processInstanceKey: key }, consistency);

  if (flags.variables) {
    const variables = await ctx.client.searchVariables(
      {
        filter: { processInstanceKey: key },
        truncateValues: false
      },
      consistency
    );

    return {
      kind: 'get',
      data: { ...result, variables: variables.items || [] }
    };
  }

  return { kind: 'get', data: result };
});

const createProcessInstanceCommand = defineCommand('create', 'process-instance', async (ctx, flags) => {
  const processDefinitionId = flags.id;

  let variables;

  if (flags.variables) {
    try {
      variables = JSON.parse(flags.variables);
    } catch {
      throw new Error('Invalid JSON for --variables');
    }
  }

  const request = {
    processDefinitionId,
    ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {}),
    ...(variables !== undefined ? { variables } : {}),
    ...(flags.awaitCompletion ? { awaitCompletion: true } : {})
  };

  if (flags.awaitCompletion) {
    ctx.logger.info('Waiting for process instance to complete...');

    const result = await ctx.client.createProcessInstance(request);

    ctx.logger.success('Process instance completed', result.processInstanceKey);
    ctx.logger.json(result);

    return { kind: 'none' };
  }

  const result = await ctx.client.createProcessInstance(request);

  return {
    kind: 'success',
    message: 'Process instance created',
    key: result.processInstanceKey
  };
});

const cancelProcessInstanceCommand = defineCommand('cancel', 'process-instance', async (ctx, flags, args) => {
  const key = args.key;

  await ctx.client.cancelProcessInstance({ processInstanceKey: key });

  return { kind: 'success', message: `Process instance ${key} cancelled` };
});

module.exports = {
  listProcessInstancesCommand,
  searchProcessInstancesCommand,
  getProcessInstanceCommand,
  createProcessInstanceCommand,
  cancelProcessInstanceCommand
};
