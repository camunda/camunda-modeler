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
 * Command-line parsing and dispatch.
 *
 * Mirrors c8ctl's `src/index.ts` argv handling: a raw command string is
 * tokenised, resolved to a canonical verb × resource, its flags and
 * positionals are validated against the registry, and the matching framework
 * handler is invoked. Rendering and error handling live in the framework.
 */

const {
  resolveVerb,
  resolveResource,
  getResourceDef,
  validateFlags,
  validatePositionals,
  detectUnknownFlags
} = require('./framework');
const { COMMAND_REGISTRY } = require('./framework/command-registry');
const { COMMAND_DISPATCH } = require('./commands');

/**
 * Split a command line into tokens, honouring single and double quotes.
 *
 * @param {string} line
 * @returns {string[]}
 */
function tokenize(line) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;

  let match;

  while ((match = pattern.exec(line)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }

  return tokens;
}

/**
 * Parse flag/positional tokens using a resource's flag schema to decide which
 * flags are booleans and to resolve short aliases.
 *
 * @param {string[]} tokens tokens after verb (and resource)
 * @param {Record<string, import('./framework/command-registry').FlagDef>} flagDefs
 * @returns { { flags: Record<string, unknown>, positionals: string[] } }
 */
function parseArgs(tokens, flagDefs = {}) {
  const shortMap = {};

  for (const [ name, def ] of Object.entries(flagDefs)) {
    if (def.short) {
      shortMap[def.short] = name;
    }
  }

  const flags = {};
  const positionals = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    let name;
    let inlineValue;

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');

      if (eq >= 0) {
        name = body.slice(0, eq);
        inlineValue = body.slice(eq + 1);
      } else {
        name = body;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const short = token.slice(1);

      name = shortMap[short] || short;
    } else {
      positionals.push(token);
      continue;
    }

    const def = flagDefs[name];

    if (def && def.type === 'boolean') {
      flags[name] = inlineValue !== undefined ? inlineValue : true;
      continue;
    }

    if (inlineValue !== undefined) {
      flags[name] = inlineValue;
      continue;
    }

    const next = tokens[i + 1];

    if (next !== undefined && !(next.startsWith('-') && next.length > 1)) {
      flags[name] = next;
      i++;
    } else {

      // value-less non-boolean flag; surfaced by validation
      flags[name] = true;
    }
  }

  return { flags, positionals };
}

/**
 * Parse a raw command line into a structured, validated command.
 *
 * @param {string} line
 * @returns { {
 *   verb: string,
 *   resource: string|undefined,
 *   handlerKey: string,
 *   flags: Record<string, unknown>,
 *   args: Record<string, string>,
 *   positionals: string[]
 * } }
 */
function parseCommandLine(line) {
  const tokens = tokenize(line);

  if (tokens.length === 0) {
    throw new Error('Empty command');
  }

  const verb = resolveVerb(tokens[0]);

  if (!verb) {
    throw new Error(`Unknown command: ${tokens[0]}`);
  }

  const commandDef = COMMAND_REGISTRY[verb];

  if (!commandDef.requiresResource) {
    return {
      verb,
      resource: undefined,
      handlerKey: `${verb}:`,
      flags: {},
      args: {},
      positionals: tokens.slice(1)
    };
  }

  const rawResource = tokens[1];

  if (!rawResource) {
    const available = Object.keys(commandDef.resources).join(', ');

    throw new Error(`'${verb}' requires a resource. Available: ${available}`);
  }

  const resource = resolveResource(verb, rawResource);

  if (!resource) {
    const available = Object.keys(commandDef.resources).join(', ');

    throw new Error(`Unknown resource '${rawResource}' for '${verb}'. Available: ${available}`);
  }

  const resourceDef = getResourceDef(verb, resource);
  const flagDefs = resourceDef.flags || {};
  const positionalDefs = resourceDef.positionals || [];

  const { flags: rawFlags, positionals } = parseArgs(tokens.slice(2), flagDefs);

  const unknown = detectUnknownFlags(rawFlags, flagDefs);

  if (unknown.length) {
    throw new Error(`Unknown flag(s) for '${verb} ${resource}': ${unknown.map((f) => `--${f}`).join(', ')}`);
  }

  const flags = validateFlags(rawFlags, flagDefs);
  const args = validatePositionals(positionals, positionalDefs);

  return {
    verb,
    resource,
    handlerKey: `${verb}:${resource}`,
    flags,
    args,
    positionals
  };
}

/**
 * Resolve the framework handler for a parsed command, or undefined.
 *
 * @param {string} handlerKey
 * @returns {object|undefined}
 */
function getHandler(handlerKey) {
  return COMMAND_DISPATCH.get(handlerKey);
}

module.exports = {
  tokenize,
  parseArgs,
  parseCommandLine,
  getHandler,
  COMMAND_DISPATCH
};
