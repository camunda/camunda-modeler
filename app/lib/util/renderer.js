'use strict';

var electron = require('electron'),
    ipcMain = electron.ipcMain,
    app = electron.app;


function on(event, callback, that) {
  var responseEvent = event + ':response';

  ipcMain.on(event, function(evt) {
    var args = Array.prototype.slice.call(arguments).slice(1);

    function done() {
      var args =  Array.prototype.slice.call(arguments).map(function(e) {
        if (e instanceof Error) {
          return { message: e.message };
        }

        return e;
      });

      evt.sender.send(responseEvent, args);
    }

    callback.apply(that || null, args.concat(done));
  });
}

module.exports.on = on;


function send() {
  var args = Array.prototype.slice.call(arguments);

  app.mainWindow.webContents.send.apply(app.mainWindow.webContents, args);
}

module.exports.send = send;
