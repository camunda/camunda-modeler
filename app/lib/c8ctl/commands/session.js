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
 * Session commands. Ported from c8ctl `src/commands/session.ts`, adapted to
 * keep session state in memory only — the Modeler never persists the active
 * profile/tenant to disk, so these commands have no filesystem side-effect.
 */

const { defineCommand } = require('../framework');

const useProfileCommand = defineCommand('use', 'profile', async (ctx, flags, args) => {
  const name = args.name;

  const profile = ctx.config.getProfileOrModeler(name);

  if (!profile) {
    throw new Error(`Unknown profile: ${name} (see \`list profile\`)`);
  }

  ctx.session.activeProfile = profile.name;
  ctx.session.activeTenant = undefined;

  return { kind: 'success', message: `Active profile set to '${profile.name}'` };
});

const useTenantCommand = defineCommand('use', 'tenant', async (ctx, flags, args) => {
  ctx.session.activeTenant = args.tenantId;

  return { kind: 'success', message: `Active tenant set to '${args.tenantId}'` };
});

module.exports = {
  useProfileCommand,
  useTenantCommand
};
