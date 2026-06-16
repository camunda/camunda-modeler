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
 * Message commands. Ported from c8ctl `src/commands/messages.ts`.
 */

const { defineCommand } = require('../framework');

const publishMessageCommand = defineCommand('publish', 'message', async (ctx, flags, args) => {
  const name = args.name;

  let variables;

  if (flags.variables) {
    try {
      variables = JSON.parse(flags.variables);
    } catch {
      throw new Error('Invalid JSON for --variables');
    }
  }

  let timeToLive;

  if (flags.timeToLive) {
    timeToLive = parseInt(flags.timeToLive, 10);

    if (Number.isNaN(timeToLive) || timeToLive < 0) {
      throw new Error('--timeToLive must be a non-negative integer (milliseconds)');
    }
  }

  await ctx.client.publishMessage({
    name,
    ...(ctx.tenantId !== undefined ? { tenantId: ctx.tenantId } : {}),
    correlationKey: flags.correlationKey || '',
    ...(variables !== undefined ? { variables } : {}),
    ...(timeToLive !== undefined ? { timeToLive } : {})
  });

  return { kind: 'success', message: `Message '${name}' published` };
});

module.exports = {
  publishMessageCommand
};
