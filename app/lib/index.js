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

const fs = require('fs');

const { Camunda8 } = require('@camunda8/sdk');

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
const ZeebeAPI = require('./zeebe-api');
const { getTemplatesPath } = require('./template-updater/util');
const { TemplateUpdater, OOTB_CONNECTORS_ENDPOINT } = require('./template-updater/template-updater');

const FileContext = require('./file-context/file-context');
const { toFileUrl } = require('./file-context/util');
const {
  findProcessApplicationFile,
  isProcessApplicationFile
} = require('./file-context/processors/util');

const {
  readFile,
  readFileStats,
  writeFile
} = require('./file-system');

const browserOpen = require('./util/browser-open');
const fileExplorerOpen = require('./util/file-explorer-open');
const clipboardWriteText = require('./util/clipboard-write-text');
const renderer = require('./util/renderer');

const errorTracking = require('./util/error-tracking');
const { pick } = require('min-dash');

const log = Log('app:main');
const bootstrapLog = Log('app:main:bootstrap');
const clientLog = Log('client');

bootstrapLogging();
bootstrapEPIPESuppression();

const name = app.name = 'Camunda Modeler';
const version = app.version = require('../package').version;
const MINIMUM_SIZE = {
  width: 780,
  height: 580
};

var DEFAULT_USER_PATH = path.join(app.getPath('appData'), 'camunda-modeler');

bootstrapLog.info(`starting ${ name } v${ version }`);

const {
  platform
} = process;

const {
  config,
  dialog,
  fileContext,
  files,
  flags,
  menu,
  plugins,
  windowManager,
  zeebeAPI
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

// preload script
renderer.onSync('app:get-plugins', () => {

  // expose only necessary properties (e.g. not `menu` function)
  return plugins.getAll()
    .map(plugin => pick(plugin, [ 'base', 'name', 'pluginPath', 'style', 'script' ]));
});

renderer.onSync('app:get-flags', () => {
  return flags.getAll();
});

renderer.onSync('app:get-metadata', () => {
  return app.metadata;
});

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

renderer.on('dialog:open-file-explorer', function(options, done) {
  const { path } = options;

  fileExplorerOpen(path);

  done(null, undefined);
});

// clipboard ///////////

renderer.on('system-clipboard:write-text', function(options, done) {
  const { text } = options;

  clipboardWriteText(text);

  done(null, undefined);
});

// file context //////////
renderer.on('file-context:add-root', function(options, done) {
  const { filePath } = options;

  fileContext.addRoot(filePath);

  done(null);
});

renderer.on('file-context:remove-root', function(options, done) {
  const { filePath } = options;

  fileContext.removeRoot(filePath);

  done(null);
});

renderer.on('file-context:file-opened', function(filePath, options, done) {
  const fileUrl = toFileUrl(filePath);

  fileContext.fileOpened(fileUrl, options);

  const processApplicationFile = findProcessApplicationFile(filePath);

  if (processApplicationFile) {
    fileContext.addRoot(path.dirname(processApplicationFile));
  }

  done(null);
});

renderer.on('file-context:file-updated', function(filePath, options, done) {
  fileContext.fileUpdated(toFileUrl(filePath), options);

  done(null);
});

renderer.on('file-context:file-closed', function(filePath, done) {
  const fileUrl = toFileUrl(filePath);

  const processApplicationFile = fileContext._indexer.getItems().find((item) => {
    return path.dirname(filePath).startsWith(path.dirname(item.file.path)) && isProcessApplicationFile(item.file.path);
  });

  if (!processApplicationFile) {
    fileContext.fileClosed(fileUrl);
  }

  done(null);
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

// zeebe api //////////

renderer.on('zeebe:checkConnection', async function(options, done) {
  try {
    const connectivity = await zeebeAPI.checkConnection(options);

    done(null, connectivity);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:deploy', async function(options, done) {
  try {
    const deploymentResult = await zeebeAPI.deploy(options);

    done(null, deploymentResult);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:startInstance', async function(options, done) {
  try {
    const runResult = await zeebeAPI.startInstance(options);

    done(null, runResult);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:getGatewayVersion', async function(options, done) {
  try {
    const gatewayVersionResponse = await zeebeAPI.getGatewayVersion(options);

    done(null, gatewayVersionResponse);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:searchProcessInstances', async function(options, done) {
  try {
    const searchProcessInstancesResponse = await zeebeAPI.searchProcessInstances(options);

    done(null, searchProcessInstancesResponse);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:searchVariables', async function(options, done) {
  try {
    const searchVariablesResponse = await zeebeAPI.searchVariables(options);

    done(null, searchVariablesResponse);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:searchIncidents', async function(options, done) {
  try {
    const searchIncidentsResponse = await zeebeAPI.searchIncidents(options);

    done(null, searchIncidentsResponse);
  } catch (err) {
    done(err);
  }
});

renderer.on('zeebe:searchElementInstances', async function(options, done) {
  try {
    const searchElementInstancesResponse = await zeebeAPI.searchElementInstances(options);

    done(null, searchElementInstancesResponse);
  } catch (err) {
    done(err);
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

renderer.on('app:reload', async function() {
  app.mainWindow.reload();
});

renderer.on('app:restart', function() {
  app.relaunch();
  app.exit(0);
});

app.on('web-contents-created', (event, webContents) => {

  // open new window externally
  webContents.setWindowOpenHandler(event => {
    browserOpen(event.url);

    return { action: 'deny' };
  });

  // disable web-view (not used)
  webContents.on('will-attach-webview', () => {
    event.preventDefault();
  });

  // open in-page links externally
  // @see https://github.com/electron/electron/issues/1344#issuecomment-171516636
  webContents.on('will-navigate', (event, url) => {
    event.preventDefault();

    if (url !== webContents.getURL()) {
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
    minWidth: MINIMUM_SIZE.width,
    minHeight: MINIMUM_SIZE.height,
    webPreferences: {
      preload: path.resolve(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration,
      sandbox: !nodeIntegration // sandbox needs to be disabled for nodeIntegration=true
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

  const effectiveArgs = Cli.appendArgs(process.argv.slice(1), [ ...args, '--relaunch' ]);

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

function bootstrapEPIPESuppression() {

  let suppressing = false;
  function logEPIPEErrorOnce() {
    if (suppressing) {
      return;
    }

    suppressing = true;
    log.error('Detected EPIPE error; suppressing further EPIPE errors');
  }

  require('epipebomb')(process.stdout, logEPIPEErrorOnce);
  require('epipebomb')(process.stderr, logEPIPEErrorOnce);
}

/**
 * Bootstrap and return application components.
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
  setUserPath(flagOverrides['user-data-dir']);

  const userPath = app.getPath('userData');
  const resourcesDir = flagOverrides['resources-dir'];

  let resourcesPaths = [
    path.join(appPath, 'resources'),
    ...(resourcesDir ? [resourcesDir] : []),
    path.join(userPath, 'resources')
  ];

  if (process.env.NODE_ENV === 'development') {
    resourcesPaths = [
      ...resourcesPaths,
      path.join(cwd, 'resources')
    ];
  }

  // (2) flags
  const flags = new Flags({
    paths: resourcesPaths,
    overrides: flagOverrides
  });

  // (3) config
  const ignoredPaths = [];

  if (isConnectorTemplatesDisabled(flags, userPath)) {
    ignoredPaths.push(getTemplatesPath(userPath, OOTB_CONNECTORS_ENDPOINT.fileName));
  }

  const config = new Config({
    appPath,
    resourcesPaths,
    userPath,
    ignoredPaths
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

  // (7) window manager
  const windowManager = new WindowManager({
    config,
    electronScreen
  });

  let paths;

  // (8) plugins
  const pluginsDisabled = arePluginsDisabled(flags, config);

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
  errorTracking.setTag(Sentry, 'plugins', generatePluginsTag(plugins));

  // (9) zeebe API
  const zeebeAPI = new ZeebeAPI({ readFile }, Camunda8, flags);

  // (10) template updater
  const templateUpdater = new TemplateUpdater(userPath, isConnectorTemplatesDisabled(flags, userPath) ? [] : [ OOTB_CONNECTORS_ENDPOINT ]);

  templateUpdater.on('update:done', (hasNew, warnings) => {
    renderer.send('client:templates-update-done', hasNew, warnings);
  });

  renderer.on('client:templates-update', ({ executionPlatform, executionPlatformVersion }) => {
    templateUpdater.update(executionPlatform, executionPlatformVersion);
  });

  // (11) file context
  const fileContextLog = Log('app:file-context');

  const fileContext = new FileContext(fileContextLog);

  let lastItems = [];

  function onIndexerUpdated() {
    const items = fileContext._indexer.getItems();

    const added = items.filter(({ uri }) => !lastItems.find(({ uri: lastUri }) => uri === lastUri));
    const removed = lastItems.filter(({ uri }) => !items.find(({ uri: newUri }) => uri === newUri));

    lastItems = items;

    fileContextLog.info('added', added.map(({ file }) => file.path));
    fileContextLog.info('removed', removed.map(({ file }) => file.path));
    fileContextLog.info('items', items.map(({ uri, metadata }) => ({ uri, metadata: JSON.stringify(metadata, null, 2) })));

    renderer.send('file-context:changed', items.map(({ file, metadata }) => ({ file, metadata })));
  }

  fileContext.on('indexer:updated', onIndexerUpdated);
  fileContext.on('indexer:removed', onIndexerUpdated);

  app.on('quit', () => fileContext.close());

  return {
    config,
    dialog,
    fileContext,
    files,
    flags,
    menu,
    plugins,
    windowManager,
    zeebeAPI
  };
}

function generatePluginsTag(plugins) {

  if (!plugins || !plugins.length) {
    return 'none';
  }

  return plugins.map(({ name }) => name).join(',');
}


function setUserPath(path = DEFAULT_USER_PATH) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  app.setPath('userData', path);
}

function isConnectorTemplatesDisabled(flags, userPath) {

  // TODO(@barmac): use bootstrapped config or extract settings to a separate module
  const settings = new Config({ userPath }).get('settings');

  return (
    flags.get('disable-connector-templates', false) || settings['app.disableConnectorTemplates']
  );
}

function arePluginsDisabled(flags, config) {
  const settings = config.get('settings');

  return (
    flags.get('disable-plugins', false) || settings['app.disablePlugins']
  );
}

// expose app
module.exports = app;
