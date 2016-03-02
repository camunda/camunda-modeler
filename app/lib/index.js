'use strict';

var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var path = require('path');

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
    Dialog = require('./Dialog'),
    Menu = require('./menu'),
    Cli = require('./Cli');

var browserOpen = require('./util/browser-open'),
    renderer = require('./util/renderer');


var config = Config.load(path.join(app.getPath('userData'), 'config.json'));

Platform.create(process.platform, app, config);


// bootstrap the application's menus
new Menu(process.platform);

// bootstrap dialog
var dialog = new Dialog({
  dialog: electron.dialog,
  config: config,
  userDesktopPath: app.getPath('userDesktop')
});

// The main editor window.
var mainWindow = null;

// make app a singleton
if (config.get('single-instance', true)) {

  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {

    app.emit('editor:cmd', commandLine, workingDirectory);

    // focus existing running instance window
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }

    return true;
  });

  if (shouldQuit) {
    app.quit();
  }
}

// List of files that should be opened by the editor
app.openFiles = [];

// We need this check so we can quit after checking for unsaved diagrams
app.dirty = true;

/**
 * Open a new browser window, if non exists.
 *
 * @return {BrowserWindow}
 */
function open() {
  if (!mainWindow) {
    mainWindow = createEditorWindow();

    // This event gets triggered on graphical OS'es when the user
    // tries to quit the modeler by clicking the little 'x' button
    mainWindow.on('close', beforeQuit);

    // dereference the main window on close
    mainWindow.on('closed', function () {
      mainWindow = null;
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
  // TODO: reimplement checking modified tabs on quit
  // if (!app.dirty) {
  //   return;
  // }
  //
  // evt.preventDefault();
  //
  // // Triggers the check for unsaved diagrams
  // mainWindow.webContents.send('editor.actions', {
  //   event: 'editor.quit'
  // });
}

/**
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
function createEditorWindow() {

  var mainWindow = new BrowserWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  new Workspace(mainWindow, config);

  mainWindow.maximize();

  var indexPath = 'file://' + path.resolve(__dirname + '/../../public/index.html');

  mainWindow.loadURL(indexPath);

  mainWindow.webContents.on('did-finish-load', function() {
    app.emit('editor:open', mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function (evt, url) {
    evt.preventDefault();
    Shell.openExternal(url);
  });

  return mainWindow;
}

//////// client life-cycle //////////////////////////////
renderer.on('editor:quit', function(hasUnsavedChanges, done) {
  done(null);

  app.emit('editor:quit-allowed');
});

renderer.on('editor:import-error', function(diagramFile, trace, done) {

  var answer = dialog.showDialog('importError', { name: diagramFile.name, trace: trace });

  switch (answer) {
  case 'forum':
    browserOpen('https://forum.bpmn.io/');
    done('forum');
    break;
  case 'issue-tracker':
    browserOpen('https://github.com/bpmn-io/bpmn-js/issues');
    done('tracker');
    break;
  default:
    done('cancel');
  }

  done(null, answer);
});

renderer.on('editor:close-tab', function(diagramFile, done) {
  var answer = dialog.showDialog('close', { name: diagramFile.name });

  done(null, answer);
});

renderer.on('editor:ready', function () {
  console.log('editor:ready', app.openFiles);

  app.openFiles.forEach(function (filePath) {
    app.fileSystem.addFile(filePath);
  });
});

//////// open file handling //////////////////////////////

app.on('open-url', function (evt) {
  console.log('app:open-url', evt);

  evt.preventDefault();
});

// open-file event is only fired on Mac
app.on('open-file', function (evt, filePath) {
  console.log('app:open-file', evt, filePath);

  if (evt) {
    evt.preventDefault();
  }

  if (mainWindow) {
    app.emit('editor:file-open', filePath);
  } else {
    app.emit('editor:defer-file-open', filePath);
  }
});

app.on('editor:file-open', function (filePath) {
  console.log('app:editor:file-open', filePath);

  app.fileSystem.addFile(filePath);
});

app.on('editor:defer-file-open', function (filePath) {
  console.log('app:editor:defer-file-open', filePath);

  app.openFiles.push(filePath);
});

app.on('editor:cmd', function (argv, cwd) {
  console.log('app:editor:cmd', argv, cwd);

  var files = Cli.extractFiles(argv, cwd);

  console.log(files);
  files.forEach(function (f) {
    app.emit('open-file', null, f);
  });
});

app.on('editor:open', function (mainWindow) {
  console.log('app:editor:open');

  // TODO: FileSystem must be a singleton
  app.fileSystem = app.fileSystem || new FileSystem({
    dialog: dialog
  });
});

//////// shutdown ////////////////////////////////////

app.on('before-quit', beforeQuit);

// This is a custom event that is fired by us when there are no
// open diagrams left with unsaved changes
app.on('editor:quit-allowed', function () {
  app.dirty = false;
  app.quit();
});

//////// initialization //////////////////////////////

app.on('ready', function (evt) {
  open();
});

app.emit('editor:init');

app.emit('editor:cmd', process.argv, process.cwd());

// expose app
module.exports = app;
