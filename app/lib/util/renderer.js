'use strict';

var electron = require('electron'),
    ipcMain = electron.ipcMain,
    app = electron.app;


function on(event, callback, that) {

  ipcMain.on(event, function(evt, id, args) {

    function done(...doneArgs) {
      var actualArgs = doneArgs.map(function(e) {
        if (e instanceof Error) {
          return { message: e.message };
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
