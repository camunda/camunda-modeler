/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const log = require('./lib/log')('app:dev');

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const getAppVersion = require('./util/get-version');

// enable development perks
process.env.NODE_ENV = 'development';

// monkey-patch package version to indicate DEV mode in application
const pkg = require('./package');

pkg.version = getAppVersion(pkg, {
  nightly: 'dev'
});


const app = require('./lib');


// make sure the app quits and does not hang
app.on('before-quit', function() {
  app.exit(0);
});

app.on('app:window-created', async () => {
  try {
    const name = await installExtension(REACT_DEVELOPER_TOOLS);
    log.info('added extension <%s>', name);
  } catch (err) {
    log.error('failed to add extension', err);
  }
});

try {
  require('electron-reloader')(module);
} catch (err) {
  // ignore it
}
