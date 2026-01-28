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
const fs = require('fs');
const Log = require('./log');

const log = Log('app:dev-server');

const PORT = process.env.DEV_SERVER_PORT || 3000;

/**
 * Wait for webpack build to complete by checking for bundle.js
 * @returns {Promise<void>}
 */
async function waitForWebpackBuild() {
  const buildPath = path.resolve(__dirname, '../../client/build');
  const bundlePath = path.join(buildPath, 'bundle.js');
  const maxWaitTime = 120000; // 2 minutes
  const checkInterval = 500; // 500ms
  const startTime = Date.now();

  log.info(`waiting for webpack build at ${bundlePath}`);

  return new Promise((resolve, reject) => {
    const checkBuild = () => {
      if (fs.existsSync(bundlePath)) {
        const elapsed = Date.now() - startTime;
        console.log(`[dev-server] webpack build detected after ${elapsed}ms`);
        resolve();
      } else if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('webpack build timed out after 2 minutes'));
      } else {
        setTimeout(checkBuild, checkInterval);
      }
    };

    checkBuild();
  });
}

/**
 * Start a development server to serve the frontend
 * @returns {Promise<void>}
 */
async function startDevServer() {
  const buildPath = path.resolve(__dirname, '../../client/build');
  const app = express();

  // Serve static files from the client build directory
  app.use(express.static(buildPath));

  // Handle client-side routing - return index.html for all routes
  app.use((req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('webpack build in progress, please refresh');
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, 'localhost', async () => {
      console.log(`[dev-server] listening on http://localhost:${PORT}`);

      // Wait for webpack build to complete before resolving
      try {
        await waitForWebpackBuild();
        console.log('[dev-server] ready - resolving promise');
        resolve(server);
      } catch (err) {
        console.error('[dev-server] webpack build failed', err);
        reject(err);
      }
    }).on('error', (err) => {
      console.error('[dev-server] failed to start', err);
      reject(err);
    });
  });
}

module.exports = { startDevServer };
