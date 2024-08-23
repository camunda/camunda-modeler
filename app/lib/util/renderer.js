/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

var electron = require('electron'),
    ipcMain = electron.ipcMain,
    app = electron.app;

const {
  assign,
  pick
} = require('min-dash');


const log = require('../log')('app:renderer');

function on(event, callback, that) {

  ipcMain.on(event, function(evt, id, args) {

    function done(...doneArgs) {
      var actualArgs = doneArgs.map(function(e) {

        // error.message and error.code are not enumerable
        if (e instanceof Error) {
          return assign({}, pick(e, [ 'message', 'code' ]), e);
        }

        return e;
      });

      var responseEvent = event + ':response:' + id;

      evt.sender.send(responseEvent, actualArgs);
    }

    callback.apply(that || null, [ ...args, done ]);
  });
}

module.exports.on = on;

/**
 * Handle ipcRenderer.sendSync calls.
 *
 * @param {string} eventName
 * @param {Function} callback
 */
function onSync(eventName, callback, that) {
  ipcMain.on(eventName, (event, ...args) => {
    const result = callback.apply(that || null, args);

    event.returnValue = result;
  });
}

module.exports.onSync = onSync;

function send() {
  var args = Array.prototype.slice.call(arguments);

  if (!app.mainWindow) {
    log.warn('trying to send to non-existing client window', args[0]);

    return;
  }

  app.mainWindow.webContents.send.apply(app.mainWindow.webContents, args);
}

module.exports.send = send;
