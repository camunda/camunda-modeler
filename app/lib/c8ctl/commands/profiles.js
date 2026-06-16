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
 * Profile read commands. Ported from c8ctl `src/commands/profiles.ts`,
 * limited to read-only operations (the single filesystem-read exception).
 *
 * Profiles are merged from the Camunda Modeler settings and the c8ctl profile
 * store; both are read-only from within the Modeler.
 */

const { defineCommand } = require('../framework');
const { MODELER_PREFIX } = require('../core');

const listProfileCommand = defineCommand('list', 'profile', async (ctx) => {
  const profiles = ctx.config.getAllProfiles();

  if (profiles.length === 0) {
    return {
      kind: 'info',
      message:
        'No profiles configured.\n' +
        'Configure a connection in Camunda Modeler, or create a c8ctl profile, ' +
        'and it will appear here.'
    };
  }

  const active = ctx.session.activeProfile;
  const effective = active || ctx.config.getDefaultProfileName();

  return {
    kind: 'list',
    items: profiles.map((profile) => ({
      Name: profile.name === effective ? `* ${profile.name}` : profile.name,
      URL: profile.baseUrl || '(not set)',
      Tenant: profile.defaultTenantId || '<default>',
      Source: profile.source === 'modeler' ? 'Modeler' : 'c8ctl'
    })),
    emptyMessage: 'No profiles configured'
  };
});

const whichProfileCommand = defineCommand('which', 'profile', async (ctx) => {
  const active = ctx.session.activeProfile;

  if (active) {
    return { kind: 'info', message: `Active profile: ${active}` };
  }

  const defaultName = ctx.config.getDefaultProfileName();

  if (defaultName) {
    const profile = ctx.config.getProfileOrModeler(defaultName);
    const source = profile && profile.source === 'modeler'
      ? "the Modeler's current connection"
      : 'the only configured profile';

    return {
      kind: 'info',
      message: `No profile selected; defaulting to ${source}: ${defaultName}`
    };
  }

  if (process.env.CAMUNDA_BASE_URL) {
    return { kind: 'info', message: 'No profile selected; using CAMUNDA_* environment variables' };
  }

  return {
    kind: 'info',
    message: 'No active profile. Select one with `use profile <name>` (see `list profile`).'
  };
});

module.exports = {
  MODELER_PREFIX,
  listProfileCommand,
  whichProfileCommand
};
