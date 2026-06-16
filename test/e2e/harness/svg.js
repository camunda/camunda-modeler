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
 * Normalize an exported SVG for snapshot comparison: drop the randomly
 * generated ids diagram-js mints on every render (grid pattern + connection
 * markers) and normalize line endings (a Windows checkout may convert the
 * committed baseline to CRLF).
 *
 * @param {Buffer} buffer
 *
 * @return {string}
 */
function normalizeSvg(buffer) {
  return buffer.toString('utf8')
    .replace(/\r\n/g, '\n')
    .replace(/djs-grid-pattern-\d+/g, 'djs-grid-pattern-X')
    .replace(/marker-[a-z0-9]{20,}/g, 'marker-X');
}

module.exports = {
  normalizeSvg
};
