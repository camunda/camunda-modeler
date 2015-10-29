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
    Workspace = require('./Workspace');


var app = require('app');
var config = Config.load(path.join(app.getPath('userData'), 'config.json'));


/**
 * The main editor window.
 */
app.mainWindow = null;

// Filepath where we store the path of a file that the user tried to open by association
app.filePath = null;

// We need this check so we can quit after checking for unsaved diagrams
app.dirty = true;

/**
 * Open a new browser window, if non exists.
 *
 * @return {BrowserWindow}
 */
function open() {

  if (!app.mainWindow) {
    app.mainWindow = createEditorWindow();
  }

  app.emit('editor-create', app.mainWindow);
}

/**
 * Gets triggered whenever the user tries to exit the modeler
 *
 * @param  {Object}   Event
 */
function beforeQuit(evt) {
  if (app.dirty) {
    evt.preventDefault();

    // Triggers the check for unsaved diagrams
    app.mainWindow.webContents.send('editor.actions', { event: 'editor.quit' });
  }
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

  var indexPath = path.resolve(__dirname + '/../public/index.html');

  mainWindow.showUrl(indexPath, function () {
    app.emit('editor-open', mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function(evt, url) {
    evt.preventDefault();
    Shell.openExternal(url);
  });

  return mainWindow;
}


// init default behavior

// app.on('open-url', function(evt) {
//   evt.preventDefault();
// });

// open-file event is only fired on Mac
app.on('open-file', function(evt, filePath) {
  evt.preventDefault();

  app.filePath = filePath;

  if (app.mainWindow) {
    app.emit('association-file-open', filePath);
  }
});

app.on('ready', function(evt) {
  if (!app.mainWindow) {
    open();
  }
});

app.on('editor-open', function(mainWindow) {
  app.fileSystem = new FileSystem(mainWindow, config);

  app.emit('editor-create-menu', mainWindow);

  app.emit('association-file-open', app.filePath);

  if (app.filePath) {
    app.fileSystem.addFile(app.filePath);
  }

  // This event gets triggered on graphical OS'es when the user
  // tries to quit the modeler by clicking the little 'x' button
  app.mainWindow.on('close', beforeQuit);
});

// This event is triggered if the user tries to exit the modeler
// by using the menu or keybinding
app.on('before-quit', beforeQuit);

// This is a custom event that is fired by us when there are no
// open diagrams left with unsaved changes
app.on('app-quit-allowed', function() {
  app.dirty = false;

  app.quit();
});


// init platform specific stuff

Platform.init(process.platform, config);

// expose app
module.exports = app;
