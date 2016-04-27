'use strict';

var electron = require('electron'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow;

var path = require('path');

var Shell = require('shell');

var forEach = require('lodash/collection/forEach');

/**
 * automatically report crash reports
 *
 * @see http://electron.atom.io/docs/v0.34.0/api/crash-reporter/
 */
// TODO(nikku): do we want to do this?
// require('crash-reporter').start();

var Platform = require('./platform'),
    Config = require('./config'),
    ClientConfig = require('./client-config'),
    ContextMenu = require('./context-menu'),
    FileSystem = require('./file-system'),
    Workspace = require('./workspace'),
    Dialog = require('./dialog'),
    Menu = require('./menu'),
    Cli = require('./cli');

var browserOpen = require('./util/browser-open'),
    renderer = require('./util/renderer');

var config = Config.load(path.join(app.getPath('userData'), 'config.json'));

Platform.create(process.platform, app, config);

// variable for developing (reloading and devtools toggling)
app.developmentMode = false;

app.version = require('../../package').version;

// bootstrap the application's menus
//
// TODO(nikku): remove app.menu binding when development
// mode bootstrap issue is fixed in electron-connect
app.menu = new Menu(process.platform);

// bootstrap context-menu
new ContextMenu();

// bootstrap workspace behavior
new Workspace(config);

// bootstrap client config behavior
var clientConfig = new ClientConfig();

// bootstrap dialog
var dialog = new Dialog({
  dialog: electron.dialog,
  config: config,
  userDesktopPath: app.getPath('userDesktop')
});

// bootstrap filesystem
var fileSystem = new FileSystem({
  dialog: dialog
});


// make app a singleton
if (config.get('single-instance', true)) {

  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {

    app.emit('app:parse-cmd', commandLine, workingDirectory);

    // focus existing running instance window
    if (app.mainWindow) {
      if (app.mainWindow.isMinimized()) {
        app.mainWindow.restore();
      }

      app.mainWindow.focus();
    }
  });

  if (shouldQuit) {
    app.quit();
  }
}

//////// client life-cycle /////////////////////////////

renderer.on('dialog:unrecognized-file', function(file, done) {
  dialog.showDialog('unrecognizedFile', { name: file.name });

  done(null);
});

renderer.on('dialog:reimport-warning', function(done) {
  var answer = dialog.showDialog('reimportWarning');

  done(null, answer);
});

renderer.on('dialog:convert-namespace', function(done) {
  var answer = dialog.showDialog('namespace');

  done(null, answer);
});

renderer.on('dialog:import-error', function(filename, errorDetails, done) {

  var answer = dialog.showDialog('importError', {
    name: filename,
    errorDetails: errorDetails
  });

  if (answer === 'ask-forum') {
    browserOpen('https://forum.camunda.org/c/modeler');
  }

  // the answer is irrelevant for the client
  done(null);
});

renderer.on('dialog:close-tab', function(diagramFile, done) {
  var answer = dialog.showDialog('close', { name: diagramFile.name });

  done(null, answer);
});

renderer.on('dialog:content-changed', function(done) {
  var answer = dialog.showDialog('contentChanged');

  done(null, answer);
});


function saveCallback(saveAction, diagramFile, done) {
  saveAction.apply(fileSystem, [ diagramFile, (err, updatedDiagram) => {
    if (err) {
      return done(err);
    }

    if (updatedDiagram && updatedDiagram !== 'cancel') {
      app.emit('app:add-recent-file', updatedDiagram.path);
    }

    done(null, updatedDiagram);
  }]);
}

renderer.on('config:load', function(done) {
  console.log('[client-config]', 'load');

  try {
    done(null, clientConfig.load());
  } catch (e) {
    done(e);
  }
});

renderer.on('file:save-as', function(diagramFile, done) {
  saveCallback(fileSystem.saveAs, diagramFile, done);
});

renderer.on('file:save', function(diagramFile, done) {
  saveCallback(fileSystem.save, diagramFile, done);
});

renderer.on('file:read', function(diagramFile, done) {
  done(null, fileSystem.readFile(diagramFile.path));
});

renderer.on('file:read-stats', function(diagramFile, done) {
  done(null, fileSystem.readFileStats(diagramFile));
});

renderer.on('file:open', function(done) {
  fileSystem.open(function(err, diagramFiles) {
    if (err) {
      return done(err);
    }

    if (diagramFiles && diagramFiles !== 'cancel') {
      diagramFiles.forEach(file => {
        app.emit('app:add-recent-file', file.path);
      });
    }

    done(null, diagramFiles);
  });
});


//////// open file handling //////////////////////////////

// list of files that should be opened by the editor
app.openFiles = [];

app.on('app:parse-cmd', function(argv, cwd) {
  console.log('app:parse-cmd', argv.join(' '), cwd);

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
    return dialog.showDialog('unrecognizedFile', { name: path.basename(filePath) });
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
      dialog.showDialog('unrecognizedFile', { name: path.basename(filePath) });
    }
  });

  renderer.send('client:open-files', files);
});

renderer.on('client:ready', function() {
  app.clientReady = true;

  app.emit('app:client-ready');
});


/**
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
app.createEditorWindow = function() {

  var mainWindow = app.mainWindow = new BrowserWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  mainWindow.maximize();

  mainWindow.loadURL('file://' + path.resolve(__dirname + '/../../public/index.html'));

  mainWindow.webContents.on('will-navigate', function(e, url) {
    e.preventDefault();

    Shell.openExternal(url);
  });

  // handling case when user clicks on window close button
  mainWindow.on('close', function(e) {
    console.log('Initiating close of main window');

    if (app.quitAllowed) {
      // dereferencing main window and resetting client state
      app.mainWindow = null;
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

  app.emit('app:window-created', mainWindow);

  // only set by client, when it is ok to exit
  app.quitAllowed = false;
};


/**
 * Application entry point
 * Emitted when Electron has finished initialization.
 */
app.on('ready', function() {

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


// expose app
module.exports = app;
