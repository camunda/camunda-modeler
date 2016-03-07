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

// bootstrap filesystem
var fileSystem = new FileSystem({
  dialog: dialog
});


// make app a singleton
if (config.get('single-instance', true)) {

  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {

    app.emit('editor:cmd', commandLine, workingDirectory);

    // focus existing running instance window
    if (app.mainWindow) {
      if (app.mainWindow.isMinimized()) {
        app.mainWindow.restore();
      }
      app.mainWindow.focus();
    }

    return true;
  });

  if (shouldQuit) {
    app.emit('app:quit');
  }
}

// List of files that should be opened by the editor
app.openFiles = [];

/**
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
function createEditorWindow() {

  var mainWindow = app.mainWindow = new BrowserWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  new Workspace(mainWindow, config);

  mainWindow.maximize();

  mainWindow.loadURL('file://' + path.resolve(__dirname + '/../../public/index.html'));

  mainWindow.webContents.on('did-finish-load', function() {
    app.emit('editor:open', mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function (evt, url) {
    evt.preventDefault();

    Shell.openExternal(url);
  });

  return mainWindow;
}

//////// client life-cycle /////////////////////////////
renderer.on('editor:ready', function(done) {
  done(null);

  app.emit('editor:deferred-file-open');
});

renderer.on('dialog:unrecognized-file', function(file, done) {
  dialog.showDialog('unrecognizedFile', { name: file.name});

  done(null);
});

renderer.on('dialog:convert-namespace', function(done) {
  var answer = dialog.showDialog('namespace');

  done(null, answer);
});

renderer.on('dialog:import-error', function(diagramFile, trace, done) {

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

renderer.on('dialog:close-tab', function(diagramFile, done) {
  var answer = dialog.showDialog('close', { name: diagramFile.name });

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

renderer.on('file:save-as', function(diagramFile, done) {
  saveCallback(fileSystem.saveAs, diagramFile, done);
});

renderer.on('file:save', function(diagramFile, done) {
  saveCallback(fileSystem.save, diagramFile, done);
});

renderer.on('file:open', function(done) {
  fileSystem.open(function (err, diagramFiles) {
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

  if (app.mainWindow) {
    app.emit('editor:file-open', filePath);
  } else {
    app.emit('editor:defer-file-open', filePath);
  }
});

app.on('editor:file-open', function (filePath) {
  console.log('app:editor:file-open', filePath);
  // todo
  // fileSystem.addFile(filePath);
});

app.on('editor:defer-file-open', function (filePath) {
  console.log('app:editor:defer-file-open', filePath);

  app.openFiles.push(filePath);
});

app.on('editor:deferred-file-open', function () {
  console.log('app:editor:deferred-file-open', app.openFiles);

  // todo
  // app.openFiles.forEach(function (filePath) {
    // fileSystem.addFile(filePath);
  // });
});

app.on('editor:cmd', function (argv, cwd) {
  console.log('app:editor:cmd', argv, cwd);

  var files = Cli.extractFiles(argv, cwd);

  console.log('app:editor:cmd files:', files);

  files.forEach(function (file) {
    app.emit('open-file', null, file);
  });
});


/**
 * Application entry point
 * Emitted when Electron has finished initialization.
 */
app.on('ready', function (evt) {

  app.fileSystem = new FileSystem({
    dialog: dialog
  });

  var mainWindow = app.mainWindow = createEditorWindow();

  // Setting up application exit logic
  mainWindow.on('close', function(evt) {
    if (!app.closable) {
      evt.preventDefault();

      console.log('mainWindow:close', 'delegating "quit" to client');

      renderer.send('menu:action', 'quit');
    } else {
      console.log('mainWindow:close', 'closing main window');

      app.emit('app:quit');
    }
  });

  function quit() {
    app.closable = true;

    console.log('app:quit', 'Quitting application');

    app.quit();
  }

  renderer.on('app:quit', quit);

  app.on('window-all-closed', quit);

  mainWindow.on('closed', () => {
    // dereference the main window on close
    app.mainWindow = null;
  });


  app.emit('window:created', mainWindow);

  app.emit('editor:cmd', process.argv, process.cwd());
});


// expose app
module.exports = app;
