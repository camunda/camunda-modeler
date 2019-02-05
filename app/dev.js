const log = require('debug')('app:dev');
const logError = require('debug')('app:dev:error');

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const getAppVersion = require('./util/get-version');

// enable development perks
process.env.NODE_ENV = 'development';

// enable logging
require('debug').enable('app:*');

// monkey-patch package version to indicate DEV mode in application
const pkg = require('./package');

pkg.version = getAppVersion(pkg, {
  nightly: 'dev'
});


const app = require('./lib');


// make sure the app quits and does not hang
app.on('before-quit', function() {
  app.exit(0);
});

app.on('app:window-created', async () => {
  try {
    const name = await installExtension(REACT_DEVELOPER_TOOLS);
    log('added extension <%s>', name);
  } catch (err) {
    logError('failed to add extension', err);
  }
});

try {
  require('electron-reloader')(module);
} catch (err) {
  // ignore it
}
