'use strict';

var ConnectClient = require('electron-connect').client;

var getAppVersion = require('../util/get-version');

var app = require('../lib');

app.developmentMode = true;

app.version = getAppVersion(require('../../package'), {
  nightly: 'dev'
});

if (!global.metaData) {
  global.metaData = {};
}

global.metaData.version = app.version;

/**
 * The electron-connect client, that allows us to start and stop
 * electron via an API
 */
app.on('app:window-created', function(window) {
  app.connectClient = ConnectClient.create(window);
});

// make sure the app quits and does not hang
app.on('before-quit', function() {
  app.exit(0);
});

// workaround development mode not properly bootstrapping
// application on linux
//
// TODO(nikku): remove when fixed in electron-connect
app.on('app:window-created', function() {
  app.menu.rebuild();
});
