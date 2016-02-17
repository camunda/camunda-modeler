'use strict';

var path = require('path');

var BrowserWindow = require('electron-window');
var Shell = require('shell');

/**
 * automatically report crash reports
 *
 * @see http://electron.atom.io/docs/v0.34.0/api/crash-reporter/
 */
// TODO(nre): do we want to do this?
// require('crash-reporter').start();


var Platform = require('./platform'),
    Config = require('./Config'),
    FileSystem = require('./FileSystem'),
    Workspace = require('./Workspace'),
    SingleInstance = require('./SingleInstance'),
    Cli = require('./Cli');

var app = require('app');
var config = Config.load(path.join(app.getPath('userData'), 'config.json'));

var platform = Platform.create(process.platform, app, config);

// make app a singleton
if (config.get('single-instance', true)) {
  SingleInstance.init();
}


// The main editor window.
app.mainWindow = null;

// List of files that should be opened by the editor
app.openFiles = [];

// We need this check so we can quit after checking for unsaved diagrams
app.dirty = true;


function delay(fn, timeout) {
  return setTimeout(fn, timeout || 0);
}

// TODO: Perhaps find a more solid approach to this
function whichNotation(filePath) {
  return path.extname(filePath).replace(/^\./, '');
}

/**
 * Open a new browser window, if non exists.
 *
 * @return {BrowserWindow}
 */
function open() {

  var mainWindow = app.mainWindow;

  if (!mainWindow) {
    mainWindow = app.mainWindow = createEditorWindow();

    // This event gets triggered on graphical OS'es when the user
    // tries to quit the modeler by clicking the little 'x' button
    mainWindow.on('close', beforeQuit);

    // dereference the main window on close
    mainWindow.on('closed', function() {
      app.mainWindow = null;
    });
  }

  app.emit('editor:create', mainWindow);

  app.emit('editor:create-menu', mainWindow);
}

/**
 * Gets triggered whenever the user tries to exit the modeler
 *
 * @param  {Object}   Event
 */
function beforeQuit(evt) {
  if (!app.dirty) {
    return;
  }

  evt.preventDefault();

  // Triggers the check for unsaved diagrams
  app.mainWindow.webContents.send('editor.actions', { event: 'editor.quit' });
}


/**
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
function createEditorWindow() {

  var mainWindow = BrowserWindow.createWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  new Workspace(mainWindow, config);

  mainWindow.maximize();

  var indexPath = path.resolve(__dirname + '/../../public/index.html');

  mainWindow.showUrl(indexPath, function () {
    app.emit('editor:open', mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function(evt, url) {
    evt.preventDefault();
    Shell.openExternal(url);
  });

  return mainWindow;
}


//////// open file handling //////////////////////////////

app.on('open-url', function(evt) {
  console.log('app:open-url', evt);

  evt.preventDefault();
});

// open-file event is only fired on Mac
app.on('open-file', function(evt, filePath) {
  console.log('app:open-file', evt, filePath);

  if (evt) {
    evt.preventDefault();
  }

  if (app.mainWindow) {
    app.emit('editor:file-open', filePath);
  } else {
    app.emit('editor:defer-file-open', filePath);
  }
});

app.on('editor:file-open', function(filePath) {
  console.log('app:editor:file-open', filePath);

  app.fileSystem.addFile(filePath);
});

app.on('editor:defer-file-open', function(filePath) {
  console.log('app:editor:defer-file-open', filePath);

  app.openFiles.push(filePath);
});

app.on('editor:deferred-file-open', function() {
  console.log('app:editor:deferred-file-open', app.openFiles);

  app.openFiles.forEach(function(filePath) {
    app.fileSystem.addFile(filePath);
  });
});

app.on('editor:cmd', function(argv, cwd) {
  console.log('app:editor:cmd', argv, cwd);

  var files = Cli.extractFiles(argv, cwd);

  console.log(files);
  files.forEach(function(f) {
    app.emit('open-file', null, f);
  });
});


app.on('editor:open', function(mainWindow) {
  console.log('app:editor:open');

  app.fileSystem = new FileSystem(mainWindow, config);
});


app.on('editor:ready', function() {
  console.log('app:editor:ready');

  app.emit('editor:deferred-file-open');
});

//////// shutdown ////////////////////////////////////

app.on('before-quit', beforeQuit);

// This is a custom event that is fired by us when there are no
// open diagrams left with unsaved changes
app.on('editor:quit-allowed', function() {
  app.dirty = false;

  app.quit();
});


//////// initialization //////////////////////////////

app.on('ready', function(evt) {
  open();
});

app.emit('editor:init');

app.emit('editor:cmd', process.argv, process.cwd());

// expose app
module.exports = app;
