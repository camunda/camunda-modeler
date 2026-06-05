/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

/**
 * Describe the runtime shape of a value in a JSON-safe way, so the SAME
 * description can be produced on the main side and the renderer side and the
 * two compared. This is how we observe what Electron's IPC (structured clone)
 * does to values that JSON cannot represent (Buffer, undefined, Date, Error).
 *
 * Kept dependency-free so it can be inlined into the (require-less) renderer
 * context as well as required from the Electron main process.
 *
 * @param {any} value
 * @returns {object}
 */
function describeValue(value) {
  const type = classify(value);

  const description = { type };

  if (type === 'array') {
    description.length = value.length;
    description.items = value.map(describeValue);
    return description;
  }

  if (type === 'uint8array' || type === 'buffer') {
    description.bytes = Array.from(value);
    return description;
  }

  if (type === 'date') {
    description.iso = value.toISOString();
    return description;
  }

  if (type === 'object') {

    // Note own enumerable keys (this is what survives structured clone).
    description.keys = Object.keys(value).sort();
    description.values = {};
    description.keys.forEach(key => {
      description.values[key] = describeValue(value[key]);
    });
    return description;
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    description.value = value;
  }

  return description;
}

function classify(value) {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  // Buffer is a Uint8Array subclass; distinguish where the runtime exposes it.
  if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(value)) {
    return 'buffer';
  }

  if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) {
    return 'uint8array';
  }

  if (value instanceof Date) {
    return 'date';
  }

  if (value instanceof Error) {
    return 'error';
  }

  return typeof value;
}

module.exports = { describeValue, classify };
