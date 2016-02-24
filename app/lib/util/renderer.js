'use strict';

var ipcMain = require('electron').ipcMain;

var app = require('electron').app,
    browserWindow = app.browserWindow;



function on(event, callback) {
  var responseEvent = event + ':response';

  ipcMain.on(event, function(evt) {
    var args = Array.prototype.slice.call(arguments).slice(1);

    function done() {
      var _args =  Array.prototype.slice.call(arguments);

      evt.sender.send(responseEvent, _args);
    }

    callback.apply(null, args.concat(done));
  });
}

module.exports.on = on;


function send() {
  var args = Array.prototype.slice.call(arguments);

  browserWindow.webContents.send.apply(browserWindow.webContents, args);
}

module.exports.send = send;
