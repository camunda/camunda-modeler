'use strict';

var ConnectClient = require('electron-connect').client;

var app = require('../lib');

/**
 * The electron-connect client, that allows us to start and stop
 * electron via an API
 */
app.on('window:created', function(window) {
  app.connectClient = ConnectClient.create(window);
});