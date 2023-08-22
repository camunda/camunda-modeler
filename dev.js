/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const log = require('./app/lib/log')('app:dev');

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const getAppVersion = require('./app/util/get-version');

// enable development perks
process.env.NODE_ENV = 'development';

// monkey-patch package version to indicate DEV mode in application
const pkg = require('./app/package');

pkg.version = getAppVersion();

// monkey-patch cli args to not open this file in application
process.argv = process.argv.filter(arg => !arg.includes('dev.js'));

const app = require('./app/lib');


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

  // reload on changes but ignore client source (we want to watch build dir)
  require('electron-reloader')(module, { ignore: [ 'client/src' ] });
} catch (err) {

  // ignore it
}
