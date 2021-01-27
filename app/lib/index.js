/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  app,
  dialog: electronDialog,
  screen: electronScreen,
  session,
  BrowserWindow
} = require('electron');

const Sentry = require('@sentry/node');

const path = require('path');

const Cli = require('./cli');
const Config = require('./config');
const Dialog = require('./dialog');
const Flags = require('./flags');
const Log = require('./log');
const logTransports = require('./log/transports');
const Menu = require('./menu');
const Platform = require('./platform');
const Plugins = require('./plugins');
const WindowManager = require('./window-manager');
const Workspace = require('./workspace');

const {
  getQRMs,
  updateQRMs
} = require('./quantme');

const {
  readFile,
  readFileStats,
  writeFile
} = require('./file-system');

const browserOpen = require('./util/browser-open');
const renderer = require('./util/renderer');

const errorTracking = require('./util/error-tracking');

const log = Log('app:main');
const bootstrapLog = Log('app:main:bootstrap');
const clientLog = Log('client');

bootstrapLogging();

// start API after bootstrapping the Logging to enable logging the used port
require('./api');

const name = app.name = 'QuantME Modeler';
const version = app.version = require('../package').version;

bootstrapLog.info(`starting ${name} v${version}`);

const {
  platform
} = process;

const {
  config,
  dialog,
  files,
  flags,
  menu,
  plugins,
  windowManager
} = bootstrap();

app.flags = flags;
app.metadata = {
  version,
  name
};
app.plugins = plugins;

Platform.create(platform, app, config);

// only allow single instance if not disabled via `--no-single-instance` flag
if (flags.get('single-instance') === false) {
  log.info('single instance disabled via flag');
} else {
  const gotLock = app.requestSingleInstanceLock();

  if (gotLock) {

    app.on('second-instance', (event, argv, cwd) => {

      const {
        files
      } = Cli.parse(argv, cwd);

      app.openFiles(files);

      // focus existing running instance window
      if (app.mainWindow) {
        if (app.mainWindow.isMinimized()) {
          app.mainWindow.restore();
        }

        app.mainWindow.focus();
      }
    });
  } else {
    app.quit();
  }
}

// external //////////

renderer.on('external:open-url', function(options) {
  const url = options.url;

  browserOpen(url);
});

// dialogs //////////

renderer.on('dialog:open-files', async function(options, done) {
  const {
    activeFile
  } = options;

  if (activeFile && activeFile.path) {
    options = {
      ...options,
      defaultPath: path.dirname(activeFile.path)
    };
  }

  const filePaths = await dialog.showOpenDialog(options);

  done(null, filePaths);
});

renderer.on('dialog:open-file-error', async function(options, done) {
  const response = await dialog.showOpenFileErrorDialog(options);

  done(null, response);
});

renderer.on('dialog:save-file', async function(options, done) {
  const { file } = options;

  if (file.path) {
    options = {
      ...options,
      defaultPath: path.dirname(file.path)
    };
  }

  const filePath = await dialog.showSaveDialog(options);

  done(null, filePath);
});

renderer.on('dialog:show', async function(options, done) {
  const response = await dialog.showDialog(options);

  done(null, response);
});

// filesystem //////////

renderer.on('file:read', function(filePath, options = {}, done) {
  try {
    const newFile = readFile(filePath, options);

    done(null, newFile);
  } catch (err) {
    done(err);
  }
});

renderer.on('file:read-stats', function(file, done) {
  const newFile = readFileStats(file);

  done(null, newFile);
});

renderer.on('file:write', function(filePath, file, options = {}, done) {
  try {
    const newFile = writeFile(filePath, file, options);

    done(null, newFile);
  } catch (err) {
    done(err);
  }
});

// quantme //////////

renderer.on('quantme:get-qrms', function(done) {
  done(null, getQRMs());
});

renderer.on('quantme:update-qrms', async function(done) {
  try {
    let qrms = await updateQRMs();
    done(null, qrms);
  } catch (error) {
    done(error);
  }
});

// config //////////

renderer.on('config:get', function(key, ...args) {
  const done = args.pop();

  let value;

  try {
    value = config.get(key, ...args);

    done(null, value);
  } catch (error) {
    done(error);
  }
});

renderer.on('config:set', function(key, value, ...args) {
  const done = args.pop();

  try {
    value = config.set(key, value, ...args);

    done(null, value);
  } catch (error) {
    done(error);
  }
});

// plugin toggling //////////

renderer.on('toggle-plugins', function() {

  const pluginsDisabled = flags.get('disable-plugins');

  app.emit('restart', [pluginsDisabled ? '--no-disable-plugins' : '--disable-plugins']);
});

// open file handling //////////

app.on('app:client-ready', function() {
  bootstrapLog.info('received client-ready');

  // open pending files
  if (files.length) {
    app.openFiles(files);
  }

  renderer.send('client:started');
});

renderer.on('client:ready', function() {
  app.clientReady = true;

  app.emit('app:client-ready');
});

renderer.on('client:error', function(...args) {
  const done = args.pop();

  clientLog.error(...args);
  done(null);
});

app.on('web-contents-created', (event, webContents) => {

  // open all external links in new window
  webContents.on('new-window', function(event, url) {
    event.preventDefault();

    browserOpen(url);
  });

  // disable web-view (not used)
  webContents.on('will-attach-webview', () => {
    event.preventDefault();
  });

  // open in-page links externally by default
  // @see https://github.com/electron/electron/issues/1344#issuecomment-171516636
  webContents.on('will-navigate', (event, url) => {

    if (url !== webContents.getURL()) {
      event.preventDefault();

      browserOpen(url);
    }
  });
});

/**
 * Open the given filePaths in the editor.
 *
 * @param {Array<string>} filePaths
 */
app.openFiles = function(filePaths) {

  log.info('open files', filePaths);

  if (!app.clientReady) {

    // defer file open
    return files.push(...filePaths);
  }

  const existingFiles = filePaths.map(filePath => {

    try {
      return readFile(filePath);
    } catch (e) {
      dialog.showOpenFileErrorDialog({
        name: path.basename(filePath)
      });
    }
  }).filter(f => f);

  // open files
  renderer.send('client:open-files', existingFiles);
};

/**
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
app.createEditorWindow = function() {

  const nodeIntegration = !!flags.get('dangerously-enable-node-integration');

  if (nodeIntegration) {
    log.warn('nodeIntegration is enabled via --dangerously-enable-node-integration');
  }

  const windowOptions = {
    resizable: true,
    show: false,
    title: 'QuantME Modeling and Transformation Framework' + getTitleSuffix(app.metadata.version),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration
    }
  };

  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname + '/../resources/favicon.png');
  }

  const mainWindow = app.mainWindow = new BrowserWindow(windowOptions);

  windowManager.manage(mainWindow);

  dialog.setActiveWindow(mainWindow);

  let url = 'file://' + path.resolve(__dirname + '/../public/index.html');

  if (process.env.NODE_ENV === 'development') {
    url = 'file://' + path.resolve(__dirname + '/../../client/build/index.html');
  }

  mainWindow.loadURL(url);

  // handling case when user clicks on window close button
  mainWindow.on('close', function(e) {
    log.info('initating close of main window');

    if (app.quitAllowed) {

      // dereferencing main window and resetting client state
      app.mainWindow = null;
      dialog.setActiveWindow(null);

      app.clientReady = false;

      return log.info('main window closed');
    }

    // preventing window from closing until client allows to do so
    e.preventDefault();

    log.info('asking client to allow quit');

    app.emit('app:quit-denied');

    renderer.send('menu:action', 'quit');
  });

  mainWindow.on('focus', function() {
    log.info('window focused');

    renderer.send('client:window-focused');
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  app.emit('app:window-created', mainWindow);

  // only set by client, when it is ok to exit
  app.quitAllowed = false;
};

app.on('restart', function(args) {

  const effectiveArgs = Cli.appendArgs(process.argv.slice(1), [...args, '--relaunch']);

  log.info('restarting with args', effectiveArgs);

  app.relaunch({
    args: effectiveArgs
  });

  app.exit(0);
});

/**
 * Application entry point
 * Emitted when Electron has finished initialization.
 */
app.on('ready', function() {

  bootstrapLog.info('received ready');

  menu.registerMenuProvider('plugins', {
    plugins: plugins.getAll()
  });

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {

    const { url } = details;

    const redirectURL = plugins.getAssetPath(url);

    if (redirectURL) {
      return callback({
        redirectURL
      });
    }

    return callback({});
  });

  // quit command from menu/shortcut
  app.on('app:quit', function() {
    log.info('initiating quit');

    renderer.send('menu:action', 'quit');
  });

  // client quit verification event
  renderer.on('app:quit-allowed', function() {
    log.info('quit allowed');

    app.quitAllowed = true;

    app.mainWindow.close();
  });

  app.createEditorWindow();
});


function bootstrapLogging() {

  let logPath;

  try {
    logPath = app.getPath('logs');
  } catch (e) {
    logPath = app.getPath('userData');
  }

  Log.addTransports(
    new logTransports.Console(),
    new logTransports.File(path.join(logPath, 'log.log'))

    // TODO(nikku): we're not doing this for now
    // first we must decide how to separate diagram open warnings from
    // actual app errors in the client user interface
    // new logTransports.Client(renderer, () => app.clientReady)
  );
}

/**
 * Bootstrap and return application components.
 *
 * @return {Object}
 */
function bootstrap() {
  const appPath = path.dirname(app.getPath('exe')),
        cwd = process.cwd(),
        userDesktopPath = app.getPath('userDesktop');

  const {
    files,
    flags: flagOverrides
  } = Cli.parse(process.argv, cwd);

  // (1) user path
  if (flagOverrides['user-data-dir']) {
    app.setPath('userData', flagOverrides['user-data-dir']);
  }

  const userPath = app.getPath('userData');

  let resourcesPaths = [
    path.join(appPath, 'resources'),
    path.join(userPath, 'resources')
  ];

  if (process.env.NODE_ENV === 'development') {
    resourcesPaths = [
      ...resourcesPaths,
      path.join(cwd, 'resources')
    ];
  }

  // (2) config
  const config = new Config({
    appPath,
    resourcesPaths,
    userPath
  });

  // (3) flags
  const flags = new Flags({
    paths: resourcesPaths,
    overrides: flagOverrides
  });

  // error tracking can start as soon as config and flags are initialized.
  errorTracking.start(Sentry, version, config, flags, renderer);

  // (4) menu
  const menu = new Menu({
    platform
  });

  // (5) dialog
  const dialog = new Dialog({
    config,
    electronDialog,
    userDesktopPath
  });

  // (6) workspace
  new Workspace(config);

  // (7) plugins
  const pluginsDisabled = flags.get('disable-plugins');

  // (8) window manager
  const windowManager = new WindowManager({
    config,
    electronScreen
  });

  let paths;

  if (pluginsDisabled) {
    paths = [];

    log.info('plug-ins disabled via feature toggle');
  } else {
    paths = [
      appPath,
      ...resourcesPaths,
      userPath
    ];
  }

  const plugins = new Plugins({
    paths
  });

  // track plugins
  errorTracking.setTag(Sentry, 'plugins', plugins.getAll().map(({ name }) => name).join(','));

  return {
    config,
    dialog,
    files,
    flags,
    menu,
    plugins,
    windowManager
  };
}

/**
 * Returns the app title suffix based on app version.
 *
 * @param {string} version
 * @return {string}
 */
function getTitleSuffix(version) {
  if (version.includes('dev')) {
    return ' (dev)';
  } else if (version.includes('nightly')) {
    return ' (' + version.split('-')[1] + ')';
  }
  return '';
}


// expose app
module.exports = app;
