'use strict';

var ConnectClient = require('electron-connect').client;

var app = require('../');

/**
 * The electron-connect client, that allows us to start and stop
 * electron via an API
 */
app.connectClient = null;

app.on('editor-create', function(window) {
  app.connectClient = ConnectClient.create(window);
});