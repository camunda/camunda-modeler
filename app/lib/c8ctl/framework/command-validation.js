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
 * Flag and positional validation at the framework boundary.
 *
 * Ported from c8ctl `src/framework/command-validation.ts`. Enforces required
 * flags/positionals, coerces values to their declared types, and surfaces
 * unknown flags — all derived from the command registry.
 */

/**
 * Validate parsed flags against a resource's flag schema.
 *
 * @param {Record<string, unknown>} parsedFlags raw parsed flag values
 * @param {Record<string, import('./command-registry').FlagDef>} flagDefs
 * @returns {Record<string, unknown>} coerced flags
 */
function validateFlags(parsedFlags, flagDefs = {}) {
  const result = {};

  for (const [ name, def ] of Object.entries(flagDefs)) {
    const value = parsedFlags[name];

    if (value === undefined) {
      if (def.required) {
        throw new Error(`Missing required flag: --${name}`);
      }

      continue;
    }

    if (def.type === 'boolean') {
      result[name] = value === true || value === 'true' || value === '';
    } else {
      if (value === true) {
        throw new Error(`Flag --${name} expects a value`);
      }

      result[name] = String(value);
    }
  }

  return result;
}

/**
 * Validate positional arguments against a resource's positional schema and
 * map them to a named record.
 *
 * @param {string[]} args raw positional tokens
 * @param {import('./command-registry').PositionalDef[]} positionalDefs
 * @returns {Record<string, string>} named positionals
 */
function validatePositionals(args, positionalDefs = []) {
  const result = {};

  positionalDefs.forEach((def, index) => {
    const value = args[index];

    if (value === undefined) {
      if (def.required) {
        throw new Error(`Missing required argument: <${def.name}>`);
      }

      return;
    }

    result[def.name] = value;
  });

  return result;
}

/**
 * Detect flags that are not declared for a resource.
 *
 * @param {Record<string, unknown>} parsedFlags
 * @param {Record<string, import('./command-registry').FlagDef>} flagDefs
 * @returns {string[]} unknown flag names
 */
function detectUnknownFlags(parsedFlags, flagDefs = {}) {
  return Object.keys(parsedFlags).filter((name) => !(name in flagDefs));
}

module.exports = {
  validateFlags,
  validatePositionals,
  detectUnknownFlags
};
