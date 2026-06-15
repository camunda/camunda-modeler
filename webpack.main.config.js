/**
 * Minimal webpack config for the Electron main process.
 * The main process is not webpack-bundled in the original setup —
 * this config exists solely to satisfy @electron-forge/plugin-webpack's
 * requirement for a mainConfig.
 */

const path = require('path');

module.exports = {
  entry: './app/prod.js',
  target: 'electron-main',
  resolve: {
    mainFields: [ 'main' ],
  },
  externals: {
    // Prevent bundling of native modules / large deps that are already in node_modules
    '@sentry/node': 'commonjs @sentry/node',
    '@camunda8/sdk': 'commonjs @camunda8/sdk',
    'electron': 'commonjs electron',
  },
};
