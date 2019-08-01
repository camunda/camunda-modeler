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
  session,
  BrowserWindow
} = require('electron');

const path = require('path');

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

/**
 * automatically report crash reports
 *
 * @see http://electron.atom.io/docs/v0.34.0/api/crash-reporter/
 */
// TODO(nikku): do we want to do this?
// require('crash-reporter').start();

const Platform = require('./platform');
const Config = require('./config');
const ClientConfig = require('./client-config');
const FileSystem = require('./file-system');
const Workspace = require('./workspace');
const Dialog = require('./dialog');
const Menu = require('./menu');
const Cli = require('./cli');
const Plugins = require('./plugins');
const Deployer = require('./deployer');
const Flags = require('./flags');
const Log = require('./log');
const logTransports = require('./log/transports');

const browserOpen = require('./util/browser-open');
const renderer = require('./util/renderer');

const log = Log('app:main');
const bootstrapLog = Log('app:main:bootstrap');
const clientLog = Log('client');

bootstrapLogging();

app.version = require('../package').version;
app.name = 'Camunda Modeler';

bootstrapLog.info('starting %s v%s', app.name, app.version);

const {
  config,
  clientConfig,
  plugins,
  flags,
  files
} = bootstrap();

const {
  platform
} = process;

app.plugins = plugins;
app.flags = flags;

app.metadata = {
  version: app.version,
  name: app.name
};

Platform.create(platform, app, config);


const menu = new Menu({
  platform
});

// bootstrap filesystem
const fileSystem = new FileSystem();

// bootstrap workspace behavior
new Workspace(config, fileSystem);

// bootstrap dialog
const dialog = new Dialog({
  electronDialog,
  config: config,
  userDesktopPath: app.getPath('userDesktop')
});


// bootstrap deployer
const deployer = new Deployer({ fetch, fs, FormData });


// make app a singleton
//
// may be disabled via --no-single-instance flag
//
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
  const response = await dialog.showDialog(options, done);

  done(null, response);
});

// deploying //////////
// TODO: remove and add as plugin instead

renderer.on('deploy', handleDeployment);

// filesystem //////////

renderer.on('file:read', function(filePath, options = {}, done) {
  try {
    const newFile = fileSystem.readFile(filePath, options);

    done(null, newFile);
  } catch (err) {
    done(err);
  }
});

renderer.on('file:read-stats', function(file, done) {
  const newFile = fileSystem.readFileStats(file);

  done(null, newFile);
});

renderer.on('file:write', async function(filePath, file, options = {}, done) {
  try {
    const newFile = fileSystem.writeFile(filePath, file, options);

    done(null, newFile);
  } catch (err) {
    done(err);
  }
});

// client config //////////

renderer.on('client-config:get', function(...args) {

  const done = args[args.length - 1];

  try {
    clientConfig.get(...args);
  } catch (e) {
    if (typeof done === 'function') {
      done(e);
    }
  }
});

// plugin toggling //////////

renderer.on('toggle-plugins', function() {

  const pluginsDisabled = flags.get('disable-plugins');

  app.emit('restart', [ pluginsDisabled ? '--no-disable-plugins' : '--disable-plugins' ]);
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
 * @param {Array<String>} filePaths
 */
app.openFiles = function(filePaths) {

  log.info('open files %O', filePaths);

  if (!app.clientReady) {

    // defer file open
    return files.push(...filePaths);
  }

  const existingFiles = filePaths.map(filePath => {

    try {
      return fileSystem.readFile(filePath);
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

  const windowOptions = {
    resizable: true,
    show: false,
    title: 'Camunda Modeler'
  };

  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname + '/../resources/favicon.png');
  }

  const mainWindow = app.mainWindow = new BrowserWindow(windowOptions);

  dialog.setActiveWindow(mainWindow);

  menu.init();

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

  mainWindow.webContents.on('dom-ready', function() {
    mainWindow.maximize();
  });

  app.emit('app:window-created', mainWindow);

  // only set by client, when it is ok to exit
  app.quitAllowed = false;
};

app.on('restart', function(args) {

  const effectiveArgs = Cli.appendArgs(process.argv.slice(1), [ ...args, '--relaunch' ]);

  log.info('restarting with args %O', effectiveArgs);

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


function handleDeployment(data, done) {
  const { endpointUrl } = data;

  deployer.deploy(endpointUrl, data, function(error, result) {

    if (error) {
      log.error('failed to deploy', error);

      return done(error);
    }

    done(null, result);
  });
}

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
 * Bootstrap the application and return
 *
 * {
 *   config,
 *   clientConfig,
 *   plugins,
 *   files
 * }
 *
 * @return {Object} bootstrapped components
 */
function bootstrap() {
  const userPath = app.getPath('userData');
  const appPath = path.dirname(app.getPath('exe'));

  const cwd = process.cwd();

  const {
    files,
    flags: flagOverrides
  } = Cli.parse(process.argv, cwd);

  const additionalPaths = process.env.NODE_ENV === 'development'
    ? [ path.join(cwd, 'resources') ]
    : [ ];

  const resourcePaths = [
    path.join(userPath, 'resources'),
    path.join(appPath, 'resources'),
    ...additionalPaths
  ];

  const config = new Config({
    path: userPath
  });

  const clientConfig = new ClientConfig({
    paths: resourcePaths
  });

  const flags = new Flags({
    paths: resourcePaths,
    overrides: flagOverrides
  });

  const pluginsDisabled = flags.get('disable-plugins');

  if (pluginsDisabled) {
    log.info('plug-ins disabled via feature toggle');
  }

  // TODO(nikku): remove loading directly from {ROOT}/resources/plugins
  // we changed it to load plug-ins from {ROOT}/resources/plugins via
  // https://github.com/camunda/camunda-modeler/issues/597
  const plugins = new Plugins({
    paths: pluginsDisabled ? [] : [
      ...resourcePaths,
      userPath,
      appPath
    ]
  });

  return {
    config,
    clientConfig,
    plugins,
    flags,
    files
  };
}


// expose app
module.exports = app;
