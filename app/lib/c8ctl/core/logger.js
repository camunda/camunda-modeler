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
 * Buffer-capturing logger.
 *
 * Ported from c8ctl `src/core/logger.ts`. Where the CLI logger writes to
 * stdout/stderr, this implementation accumulates rendered lines into a buffer
 * so the result can be returned to the terminal UI as a single string. The
 * table/json/text rendering matches the CLI verbatim.
 */

const SENSITIVE_KEYS = [
  'clientSecret',
  'camundaCloudClientSecret',
  'password',
  'basicAuthPassword'
];

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively redact credential-bearing fields before rendering.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function sanitizeForLogging(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeForLogging);
  }

  if (isRecord(value)) {
    const result = {};

    for (const [ key, val ] of Object.entries(value)) {
      if (SENSITIVE_KEYS.includes(key) && val) {
        result[key] = '***';
      } else {
        result[key] = sanitizeForLogging(val);
      }
    }

    return result;
  }

  return value;
}

/**
 * Captures command output into an in-memory buffer.
 *
 * Each entry has a `stream` (`out` or `err`) so the caller can decide how to
 * present regular output versus warnings/errors.
 */
class Logger {

  constructor() {
    this._lines = [];
  }

  _write(stream, message) {
    this._lines.push({ stream, message });
  }

  info(message) {
    this._write('out', message);
  }

  warn(message) {
    this._write('err', `⚠ ${message}`);
  }

  success(message, key) {
    if (key !== undefined) {
      this._write('out', `✓ ${message} [Key: ${key}]`);
    } else {
      this._write('out', `✓ ${message}`);
    }
  }

  error(message, error) {
    this._write('err', `✗ ${message}`);

    if (error && error.message && error.message !== message) {
      this._write('err', `  ${error.message}`);
    }
  }

  /**
   * Render an array of row objects as a fixed-width text table.
   *
   * @param {Array<Record<string, unknown>>} data
   */
  table(data) {
    const filteredData = sanitizeForLogging(data);

    if (filteredData.length === 0) {
      this._write('out', 'No data to display');

      return;
    }

    const keys = Array.from(
      new Set(filteredData.flatMap((obj) => Object.keys(obj)))
    );

    const widths = {};

    keys.forEach((key) => {
      widths[key] = Math.max(
        key.length,
        ...filteredData.map((obj) => String(obj[key] ?? '').length)
      );
    });

    const header = keys.map((key) => key.padEnd(widths[key])).join(' | ');

    this._write('out', header);
    this._write('out', keys.map((key) => '-'.repeat(widths[key])).join('-+-'));

    filteredData.forEach((obj) => {
      const row = keys
        .map((key) => String(obj[key] ?? '').padEnd(widths[key]))
        .join(' | ');

      this._write('out', row);
    });
  }

  /**
   * Render a value as pretty-printed JSON.
   *
   * @param {unknown} data
   */
  json(data) {
    this._write('out', JSON.stringify(sanitizeForLogging(data), null, 2));
  }

  /**
   * Write content verbatim (e.g. BPMN XML).
   *
   * @param {string} content
   */
  output(content) {
    this._write('out', content);
  }

  /**
   * Whether any error-stream output was captured.
   *
   * @returns {boolean}
   */
  hasErrors() {
    return this._lines.some((line) => line.stream === 'err');
  }

  /**
   * Join all captured lines into a single string.
   *
   * @returns {string}
   */
  toString() {
    return this._lines.map((line) => line.message).join('\n');
  }

  /**
   * Return captured lines as structured entries.
   *
   * @returns {Array<{ stream: string, message: string }>}
   */
  getLines() {
    return this._lines.slice();
  }
}

module.exports = {
  Logger,
  isRecord,
  sanitizeForLogging
};
