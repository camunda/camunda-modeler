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
 * Incident commands. Ported from c8ctl `src/commands/incidents.ts`.
 */

const { defineCommand } = require('../framework');
const { fetchAllPages } = require('../core');

const listIncidentsCommand = defineCommand('list', 'incident', async (ctx, flags) => {
  const filter = {
    filter: {
      ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {})
    }
  };

  if (flags.state) {
    filter.filter.state = flags.state;
  }

  if (flags.processInstanceKey) {
    filter.filter.processInstanceKey = flags.processInstanceKey;
  }

  const items = await fetchAllPages(
    (f, opts) => ctx.client.searchIncidents(f, opts),
    filter,
    undefined,
    ctx.limit
  );

  return {
    kind: 'list',
    items: items.map((incident) => ({
      Key: incident.incidentKey,
      Type: incident.errorType,
      Message: (incident.errorMessage || '').substring(0, 50),
      State: incident.state,
      Created: incident.creationTime || '-',
      'Process Instance': incident.processInstanceKey,
      'Tenant ID': incident.tenantId
    })),
    emptyMessage: 'No incidents found'
  };
});

const getIncidentCommand = defineCommand('get', 'incident', async (ctx, flags, args) => {
  const result = await ctx.client.getIncident(
    { incidentKey: args.key },
    { consistency: { waitUpToMs: 0 } }
  );

  return { kind: 'get', data: result };
});

const resolveIncidentCommand = defineCommand('resolve', 'incident', async (ctx, flags, args) => {
  await ctx.client.resolveIncident({ incidentKey: args.key });

  return { kind: 'success', message: `Incident ${args.key} resolved` };
});

module.exports = {
  listIncidentsCommand,
  getIncidentCommand,
  resolveIncidentCommand
};
