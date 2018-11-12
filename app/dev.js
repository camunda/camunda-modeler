'use strict';

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const getAppVersion = require('./util/get-version');

const app = require('./lib');

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
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.error('An error occurred: ', err));
});

try {
  require('electron-reloader')(module);
} catch (err) {
  console.log(err);
  // ignore it
}
