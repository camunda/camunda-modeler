'use strict';

var ConnectClient = require('electron-connect').client;

var app = require('../lib');

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

app.developmentMode = true;

app.on('app:window-created', function() {
  app.menu.rebuild();
});
