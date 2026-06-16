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
 * Command definition framework.
 *
 * Ported from c8ctl `src/framework/command-framework.ts`. `defineCommand(verb,
 * resource, handler)` wraps a pure handler so the framework owns result
 * rendering and error handling in one place. Handlers return a `CommandResult`
 * discriminated union (`list`, `get`, `raw`, `info`, `success`, `none`) and
 * never touch the logger's table/json methods directly.
 */

const { handleCommandError } = require('../core');

/**
 * Marker stamped on every value produced by `defineCommand`, so dispatch can
 * verify a handler went through the framework factory.
 */
const DEFINE_COMMAND_MARKER = Symbol('c8ctl.defineCommand');

/**
 * Render a `CommandResult` to the logger.
 *
 * @param {import('../core').Logger} logger
 * @param {object} result
 */
function renderResult(logger, result) {
  if (!result || !result.kind) {
    return;
  }

  switch (result.kind) {
  case 'list':
    if (!result.items || result.items.length === 0) {
      logger.info(result.emptyMessage || 'No results found');
    } else {
      logger.table(result.items);
    }
    break;

  case 'get':
    if (result.message) {
      logger.info(result.message);
    }
    logger.json(result.data);
    break;

  case 'raw':
    logger.output(result.content);
    break;

  case 'info':
    logger.info(result.message);
    break;

  case 'success':
    logger.success(result.message, result.key);
    break;

  case 'none':
    break;

  default:
    throw new Error(`Unknown result kind: ${result.kind}`);
  }
}

/**
 * Define a command handler for a verb × resource pair.
 *
 * @param {string} verb canonical verb
 * @param {string} resource canonical resource
 * @param {(ctx: object, flags: object, args: object) => Promise<object|void>} handler
 * @returns {object} framework command handler
 */
function defineCommand(verb, resource, handler) {
  const command = {
    verb,
    resource,

    async execute(ctx) {
      try {
        const result = await handler(ctx, ctx.flags, ctx.args);

        renderResult(ctx.logger, result);
      } catch (error) {
        const resourceText = resource ? ` ${resource}` : '';

        handleCommandError(ctx.logger, `Failed to ${verb}${resourceText}`, error);
      }
    }
  };

  Object.defineProperty(command, DEFINE_COMMAND_MARKER, {
    value: true,
    enumerable: false
  });

  return command;
}

/**
 * Whether a value was produced by `defineCommand`.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isDefinedCommand(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, DEFINE_COMMAND_MARKER) &&
    value[DEFINE_COMMAND_MARKER] === true
  );
}

module.exports = {
  defineCommand,
  renderResult,
  isDefinedCommand,
  DEFINE_COMMAND_MARKER
};
