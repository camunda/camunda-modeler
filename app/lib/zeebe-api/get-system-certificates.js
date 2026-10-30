/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const tls = require('node:tls');

let _cachedCertificates;

module.exports = getSystemCertificates;

/**
 * Get certificates from the system trust store.
 *
 * The bundled root certificates are included, too, as the result
 * is used in place of the defaults when establishing connections.
 *
 * @returns {Promise<string[]>}
 */
async function getSystemCertificates() {
  if (_cachedCertificates) {
    return _cachedCertificates;
  }

  _cachedCertificates = Array.from(new Set([
    ...tls.getCACertificates('system'),
    ...tls.getCACertificates('default')
  ]));

  return _cachedCertificates;
}
