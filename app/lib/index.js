'use strict';

const {
  app,
  dialog: electronDialog,
  BrowserWindow
} = require('electron');

var path = require('path');

const {
  assign,
  forEach
} = require('min-dash');

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

const browserOpen = require('./util/browser-open');
const renderer = require('./util/renderer');

var config = Config.load(path.join(app.getPath('userData'), 'config.json'));

Platform.create(process.platform, app, config);

// variable for developing (reloading and devtools toggling)
app.developmentMode = false;

app.version = require('../package').version;
app.name = 'Camunda Modeler';

// this is shared variable between main and renderer processes
global.metaData = {
  version: app.version,
  name: app.name
};

// get directory of executable
var appPath = path.dirname(app.getPath('exe'));

var menu = new Menu(process.platform);

// bootstrap filesystem
var fileSystem = new FileSystem();

// bootstrap workspace behavior
new Workspace(config, fileSystem);

// bootstrap client config behavior
var clientConfig = new ClientConfig(app);

// bootstrap dialog
var dialog = new Dialog({
  electronDialog,
  config: config,
  userDesktopPath: app.getPath('userDesktop')
});


// bootstrap deployer
var deployer = new Deployer({ fetch, fs, FormData });


// make app a singleton
if (config.get('single-instance', true)) {

  const gotLock = app.requestSingleInstanceLock();

  if (gotLock) {

    app.on('second-instance', (event, commandLine, workingDirectory) => {

      app.emit('app:parse-cmd', commandLine, workingDirectory);

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
  var url = options.url;

  browserOpen(url);
});

// dialogs //////////

renderer.on('dialog:open-files', async function(options, done) {
  const {
    activeFile
  } = options;

  if (activeFile && activeFile.path) {
    assign(options, {
      defaultPath: path.dirname(activeFile.path)
    });
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
    assign(options, {
      defaultPath: path.dirname(file.path)
    });
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

  var done = args[args.length - 1];

  try {
    clientConfig.get(...args);
  } catch (e) {
    if (typeof done === 'function') {
      done(e);
    }
  }
});

// open file handling //////////

// list of files that should be opened by the editor
app.openFiles = [];

app.on('app:parse-cmd', function(argv, cwd) {
  console.log('app:parse-cmd', argv.join(' '), cwd);

  // will result in opening dev.js as file
  var files = Cli.extractFiles(argv, cwd);

  files.forEach(function(file) {
    app.emit('app:open-file', file);
  });
});

app.on('app:open-file', function(filePath) {
  var file;

  console.log('app:open-file', filePath);

  if (!app.clientReady) {

    // defer file open
    return app.openFiles.push(filePath);
  }

  try {
    file = fileSystem.readFile(filePath);
  } catch (e) {
    dialog.showOpenFileErrorDialog({
      name: path.basename(filePath)
    });
  }

  // open file immediately
  renderer.send('client:open-files', [ file ]);
});

app.on('app:client-ready', function() {
  var files = [];

  console.log('app:client-ready');

  forEach(app.openFiles, function(filePath) {
    try {
      files.push(fileSystem.readFile(filePath));
    } catch (e) {
      dialog.showOpenFileErrorDialog({
        name: path.basename(filePath)
      });
    }
  });

  // renderer.send('client:open-files', files);

  renderer.send('client:started');
});

renderer.on('client:ready', function() {
  app.clientReady = true;

  app.emit('app:client-ready');
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
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
app.createEditorWindow = function() {

  var windowOptions = {
    resizable: true,
    show: false,
    title: 'Camunda Modeler'
  };

  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname + '/../resources/favicon.png');
  }

  var mainWindow = app.mainWindow = new BrowserWindow(windowOptions);

  dialog.setActiveWindow(mainWindow);

  menu.init();

  var url = 'file://' + path.resolve(__dirname + '/../public/index.html');

  if (app.developmentMode) {
    url = 'file://' + path.resolve(__dirname + '/../../client/build/index.html');
  }

  mainWindow.loadURL(url);

  // handling case when user clicks on window close button
  mainWindow.on('close', function(e) {
    console.log('Initiating close of main window');

    if (app.quitAllowed) {
      // dereferencing main window and resetting client state
      app.mainWindow = null;
      dialog.setActiveWindow(null);

      app.clientReady = false;

      return console.log('Main window closed');
    }

    // preventing window from closing until client allows to do so
    e.preventDefault();

    console.log('Asking client to allow application quit');

    app.emit('app:quit-denied');

    renderer.send('menu:action', 'quit');
  });

  mainWindow.on('focus', function() {
    console.log('Window focused');
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


/**
 * Application entry point
 * Emitted when Electron has finished initialization.
 */
app.on('ready', function() {

  app.plugins = new Plugins({
    paths: [
      app.getPath('userData'),
      appPath
    ].concat(app.developmentMode ? [ path.resolve(__dirname + '/../../resources') ] : [])
  });

  // quit command from menu/shortcut
  app.on('app:quit', function() {
    console.log('Initiating termination of the application');

    renderer.send('menu:action', 'quit');
  });

  // client quit verification event
  renderer.on('app:quit-allowed', function() {
    console.log('Quit allowed');

    app.quitAllowed = true;

    app.mainWindow.close();
  });

  app.createEditorWindow();

  app.emit('app:parse-cmd', process.argv, process.cwd());
});


function handleDeployment(data, done) {
  const { endpointUrl } = data;

  deployer.deploy(endpointUrl, data, function(error, result) {

    if (error) {
      console.error('failed to deploy', error);

      return done(error);
    }

    done(null, result);
  });
}

// expose app
module.exports = app;
