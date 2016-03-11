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
app.fileSystem = new FileSystem({
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

//////// client life-cycle /////////////////////////////
renderer.on('editor:ready', function(done) {
  done(null);

  app.emit('editor:deferred-file-open');
});

renderer.on('dialog:unrecognized-file', function(file, done) {
  dialog.showDialog('unrecognizedFile', { name: file.name});

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


function saveCallback(saveAction, diagramFile, done) {
  saveAction.apply(app.fileSystem, [ diagramFile, (err, updatedDiagram) => {
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
  saveCallback(app.fileSystem.saveAs, diagramFile, done);
});

renderer.on('file:save', function(diagramFile, done) {
  saveCallback(app.fileSystem.save, diagramFile, done);
});

renderer.on('file:open', function(done) {
  app.fileSystem.open(function (err, diagramFiles) {
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
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
app.createEditorWindow = function () {

  var mainWindow = app.mainWindow = new BrowserWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  new Workspace(config);

  mainWindow.maximize();

  mainWindow.loadURL('file://' + path.resolve(__dirname + '/../../public/index.html'));

  mainWindow.webContents.on('did-finish-load', function() {
    app.emit('editor:open', mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function (evt, url) {
    evt.preventDefault();

    Shell.openExternal(url);
  });

  // handling case when user clicks on window close button
  mainWindow.on('close', function(e) {
    console.log('Initiating close of main window');

    if (app.quitAllowed) {
      // dereferencing main window on close
      console.log('Main window closed');

      return app.mainWindow = null;
    }

    // preventing window from closing until client allows to do so
    e.preventDefault();

    console.log('Asking client to allow application quit');

    app.emit('app:quit-denied');

    renderer.send('menu:action', 'quit');
  });

  app.emit('app:window-created', mainWindow);

  // only set by client, when it is ok to exit
  app.quitAllowed = false;
};


/**
 * Application entry point
 * Emitted when Electron has finished initialization.
 */
app.on('ready', function (evt) {

  // quit command from menu/shortcut
  app.on('app:quit', function quit() {
    console.log('Initiating termination of the application');

    renderer.send('menu:action', 'quit');
  });

  // client quit verification event
  renderer.on('app:quit-allowed', function () {
    console.log('Quit allowed');

    app.quitAllowed = true;

    app.mainWindow.close();
  });

  app.createEditorWindow();

  app.emit('editor:cmd', process.argv, process.cwd());
});


// expose app
module.exports = app;
