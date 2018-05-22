'use strict';

var getAppVersion = require('./util/get-version');

var app = require('./lib');

app.developmentMode = true;

app.version = getAppVersion(require('./package'), {
  nightly: 'dev'
});


if (!global.metaData) {
  global.metaData = {};
}

global.metaData.version = app.version;

// make sure the app quits and does not hang
app.on('before-quit', function() {
  app.exit(0);
});

app.on('app:window-created', function() {
  app.menu.rebuild();
});

try {
  require('electron-reloader')(module);
} catch (err) {
  console.log(err);
  // ignore it
}