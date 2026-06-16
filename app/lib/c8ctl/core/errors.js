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
 * Centralised error handling for c8ctl command operations.
 *
 * Ported from c8ctl `src/core/errors.ts`, adapted for an embedded
 * (non-process-exiting) runtime: instead of `process.exit(1)`, the error is
 * rendered to the logger and a `CommandError` is thrown so the framework can
 * surface it to the terminal UI.
 */

const { isRecord } = require('./logger');

/**
 * Error type thrown after a command failure was rendered to the logger.
 *
 * Used as a control-flow signal so the framework knows the failure has already
 * been reported and just needs to mark the invocation as failed.
 */
class CommandError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CommandError';
  }
}

/**
 * Normalise any thrown value into an `Error` instance.
 *
 * Preserves actionable information from RFC 9457 problem-detail objects (which
 * the Camunda SDK throws as plain objects, not Errors) so users see a
 * meaningful message instead of `[object Object]`.
 *
 * @param {unknown} error
 * @param {string} [fallbackMessage]
 * @returns {Error}
 */
function normalizeToError(error, fallbackMessage = 'Operation failed') {
  if (error instanceof Error) {
    return error;
  }

  const raw = isRecord(error) ? error : {};
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  const detail = typeof raw.detail === 'string' ? raw.detail : undefined;
  const status = typeof raw.status === 'number' ? raw.status : undefined;

  const head = [ title || fallbackMessage, detail ].filter(Boolean).join(': ');
  const message = status !== undefined ? `${head} (status ${status})` : head;

  return new Error(message, { cause: error });
}

/**
 * Handle a command error consistently: render a terse message to the logger
 * and throw a `CommandError` so the framework marks the invocation failed.
 *
 * @param {import('./logger').Logger} logger
 * @param {string} message
 * @param {unknown} error
 * @param {string[]} [additionalHints]
 * @returns {never}
 */
function handleCommandError(logger, message, error, additionalHints) {
  const normalizedError = normalizeToError(error, message);

  if (normalizedError.message === message) {
    logger.error(message);
  } else {
    logger.error(message, normalizedError);
  }

  if (additionalHints) {
    for (const hint of additionalHints) {
      logger.info(hint);
    }
  }

  throw new CommandError(normalizedError.message);
}

module.exports = {
  CommandError,
  normalizeToError,
  handleCommandError
};
