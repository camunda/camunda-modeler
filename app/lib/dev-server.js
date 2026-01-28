/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const express = require('express');
const path = require('path');
const Log = require('./log');

const log = Log('app:dev-server');

const PORT = process.env.DEV_SERVER_PORT || 3000;

/**
 * Start a development server to serve the frontend
 * @returns {Promise<void>}
 */
async function startDevServer() {
  const app = express();

  // Serve static files from the client build directory
  const buildPath = path.resolve(__dirname, '../../client/build');
  app.use(express.static(buildPath));

  // Handle client-side routing - return index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, 'localhost', () => {
      log.info(`dev server listening on http://localhost:${PORT}`);
      resolve(server);
    }).on('error', (err) => {
      log.error('failed to start dev server', err);
      reject(err);
    });
  });
}

module.exports = { startDevServer };
