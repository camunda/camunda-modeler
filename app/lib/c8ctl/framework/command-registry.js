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
 * Declarative command registry — the single source of truth for every
 * verb × resource combination, its flags, positionals, and help metadata.
 *
 * Ported from c8ctl `src/framework/command-registry.ts`. Validation, dispatch,
 * help, and completion all derive their data from this object rather than
 * maintaining separate copies.
 *
 * Scope: only commands whose sole side-effect is an orchestration-cluster-api
 * REST call are included, plus the `profile` read commands (the single
 * filesystem-read exception) and the in-memory `use`/`which` session commands.
 *
 * To add a command: add its resource entry here and register a handler with
 * `defineCommand(verb, resource, handler)` in `commands/`.
 *
 * @typedef { {
 *   type: 'string' | 'boolean',
 *   description: string,
 *   short?: string,
 *   required?: boolean
 * } } FlagDef
 *
 * @typedef { {
 *   name: string,
 *   required?: boolean,
 *   description?: string
 * } } PositionalDef
 *
 * @typedef { {
 *   description: string,
 *   aliases?: string[],
 *   flags?: Record<string, FlagDef>,
 *   positionals?: PositionalDef[]
 * } } ResourceDef
 *
 * @typedef { {
 *   description: string,
 *   aliases?: string[],
 *   requiresResource: boolean,
 *   resources: Record<string, ResourceDef>
 * } } CommandDef
 */

const KEY_POSITIONAL = { name: 'key', required: true, description: 'Resource key' };

const VARIABLES_FLAG = {
  type: 'string',
  description: 'Process variables as a JSON object'
};

const LIMIT_FLAG = {
  type: 'string',
  description: 'Maximum number of results to return'
};

/** @type {Record<string, CommandDef>} */
const COMMAND_REGISTRY = {
  list: {
    description: 'List resources',
    aliases: [ 'ls' ],
    requiresResource: true,
    resources: {
      'process-instance': {
        description: 'List process instances',
        aliases: [ 'pi' ],
        flags: {
          state: { type: 'string', description: 'Filter by state (e.g. ACTIVE, COMPLETED)' },
          id: { type: 'string', description: 'Filter by process definition id' },
          all: { type: 'boolean', description: 'Include all states (not just ACTIVE)' },
          limit: LIMIT_FLAG
        }
      },
      'process-definition': {
        description: 'List process definitions',
        aliases: [ 'pd' ],
        flags: {
          limit: LIMIT_FLAG
        }
      },
      incident: {
        description: 'List incidents',
        aliases: [ 'inc' ],
        flags: {
          state: { type: 'string', description: 'Filter by state' },
          processInstanceKey: { type: 'string', description: 'Filter by process instance key' },
          limit: LIMIT_FLAG
        }
      },
      profile: {
        description: 'List connection profiles (Modeler + c8ctl)',
        aliases: [ 'profiles' ]
      }
    }
  },

  get: {
    description: 'Get a single resource',
    requiresResource: true,
    resources: {
      topology: {
        description: 'Get cluster topology'
      },
      'process-instance': {
        description: 'Get a process instance by key',
        aliases: [ 'pi' ],
        positionals: [ KEY_POSITIONAL ],
        flags: {
          variables: { type: 'boolean', description: 'Include process instance variables' }
        }
      },
      'process-definition': {
        description: 'Get a process definition by key',
        aliases: [ 'pd' ],
        positionals: [ KEY_POSITIONAL ],
        flags: {
          xml: { type: 'boolean', description: 'Return the BPMN XML' }
        }
      },
      incident: {
        description: 'Get an incident by key',
        aliases: [ 'inc' ],
        positionals: [ KEY_POSITIONAL ]
      }
    }
  },

  search: {
    description: 'Search resources with filters',
    requiresResource: true,
    resources: {
      'process-instance': {
        description: 'Search process instances',
        aliases: [ 'pi' ],
        flags: {
          state: { type: 'string', description: 'Filter by state' },
          id: { type: 'string', description: 'Filter by process definition id' },
          limit: LIMIT_FLAG
        }
      }
    }
  },

  create: {
    description: 'Create a resource',
    requiresResource: true,
    resources: {
      'process-instance': {
        description: 'Create (start) a process instance',
        aliases: [ 'pi' ],
        flags: {
          id: { type: 'string', description: 'Process definition id', required: true },
          variables: VARIABLES_FLAG,
          awaitCompletion: { type: 'boolean', description: 'Wait for the instance to complete' }
        }
      }
    }
  },

  cancel: {
    description: 'Cancel a resource',
    requiresResource: true,
    resources: {
      'process-instance': {
        description: 'Cancel a process instance',
        aliases: [ 'pi' ],
        positionals: [ KEY_POSITIONAL ]
      }
    }
  },

  resolve: {
    description: 'Resolve a resource',
    requiresResource: true,
    resources: {
      incident: {
        description: 'Resolve an incident',
        aliases: [ 'inc' ],
        positionals: [ KEY_POSITIONAL ]
      }
    }
  },

  publish: {
    description: 'Publish a resource',
    requiresResource: true,
    resources: {
      message: {
        description: 'Publish a message',
        aliases: [ 'msg' ],
        positionals: [ { name: 'name', required: true, description: 'Message name' } ],
        flags: {
          correlationKey: { type: 'string', description: 'Correlation key' },
          variables: VARIABLES_FLAG,
          timeToLive: { type: 'string', description: 'Time to live in milliseconds' }
        }
      }
    }
  },

  use: {
    description: 'Select session defaults (in-memory, not persisted)',
    requiresResource: true,
    resources: {
      profile: {
        description: 'Set the active connection profile',
        positionals: [ { name: 'name', required: true, description: 'Profile name' } ]
      },
      tenant: {
        description: 'Set the active tenant',
        positionals: [ { name: 'tenantId', required: true, description: 'Tenant id' } ]
      }
    }
  },

  which: {
    description: 'Show current session selection',
    requiresResource: true,
    resources: {
      profile: {
        description: 'Show the active connection profile'
      }
    }
  },

  help: {
    description: 'Show available commands',
    requiresResource: false,
    resources: {}
  }
};

/**
 * Map verb aliases to canonical verbs.
 *
 * @returns {Record<string, string>}
 */
function buildVerbAliasMap() {
  const map = {};

  for (const [ verb, def ] of Object.entries(COMMAND_REGISTRY)) {
    map[verb] = verb;

    for (const alias of def.aliases || []) {
      map[alias] = verb;
    }
  }

  return map;
}

/**
 * Map resource aliases to canonical resource names, per verb.
 *
 * @param {string} verb canonical verb
 * @returns {Record<string, string>}
 */
function buildResourceAliasMap(verb) {
  const def = COMMAND_REGISTRY[verb];
  const map = {};

  if (!def) {
    return map;
  }

  for (const [ resource, resourceDef ] of Object.entries(def.resources)) {
    map[resource] = resource;

    for (const alias of resourceDef.aliases || []) {
      map[alias] = resource;
    }
  }

  return map;
}

const VERB_ALIASES = buildVerbAliasMap();

/**
 * Resolve a raw verb token to its canonical verb, or undefined.
 *
 * @param {string} rawVerb
 * @returns {string|undefined}
 */
function resolveVerb(rawVerb) {
  return VERB_ALIASES[rawVerb];
}

/**
 * Resolve a raw resource token to its canonical resource for a verb.
 *
 * @param {string} verb canonical verb
 * @param {string} rawResource
 * @returns {string|undefined}
 */
function resolveResource(verb, rawResource) {
  return buildResourceAliasMap(verb)[rawResource];
}

/**
 * Resolve the effective resource definition for a verb × resource pair.
 *
 * @param {string} verb canonical verb
 * @param {string} resource canonical resource
 * @returns {ResourceDef|undefined}
 */
function getResourceDef(verb, resource) {
  const def = COMMAND_REGISTRY[verb];

  return def && def.resources[resource];
}

module.exports = {
  COMMAND_REGISTRY,
  resolveVerb,
  resolveResource,
  getResourceDef,
  buildResourceAliasMap
};
