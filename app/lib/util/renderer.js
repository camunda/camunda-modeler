'use strict';

var electron = require('electron'),
    ipcMain = electron.ipcMain,
    app = electron.app;


function on(event, callback, that) {
  var responseEvent = event + ':response';

  ipcMain.on(event, function(evt) {
    var args = Array.prototype.slice.call(arguments).slice(1);

    function done() {
      var _args =  Array.prototype.slice.call(arguments);

      evt.sender.send(responseEvent, _args);
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
