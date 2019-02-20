/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var electron = require('electron'),
    ipcMain = electron.ipcMain,
    app = electron.app;

const {
  assign,
  pick
} = require('min-dash');


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


function send() {
  var args = Array.prototype.slice.call(arguments);

  app.mainWindow.webContents.send.apply(app.mainWindow.webContents, args);
}

module.exports.send = send;
