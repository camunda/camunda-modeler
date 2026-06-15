/**
 * Wrapper renderer webpack config for @electron-forge/plugin-webpack.
 *
 * The client webpack config uses relative paths relative to client/.
 * We override context and output to make it work from the repo root.
 */

const path = require('path');

const clientConfig = require('./client/webpack.config.js');

const clientDir = path.resolve(__dirname, 'client');

module.exports = {
  ...clientConfig,

  // Fix: webpack resolves relative entry paths against context; default is cwd (root).
  context: clientDir,

  // Fix: output to .webpack/renderer/ as Forge expects (plugin overrides this anyway).
  output: {
    ...clientConfig.output,
    path: path.resolve(__dirname, '.webpack/renderer'),
  },
};
