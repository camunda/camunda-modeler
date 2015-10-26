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
    FileSystem = require('./FileSystem');


var app = require('app');
var config = Config.load(path.join(app.getPath('userData'), 'config.json'));


/**
 * The main editor window.
 */
app.mainWindow = null;

// Filepath where we store the path of a file that the user tried to open by association
app.filePath = null;

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
 * Create the main window that represents the editor.
 *
 * @return {BrowserWindow}
 */
function createEditorWindow() {

  var mainWindow = BrowserWindow.createWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

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

app.on('open-file', function(evt, filePath) {
  app.filePath = filePath;

  if (app.mainWindow) {
    app.fileSystem.addFile(filePath);
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

  if (app.filePath) {
    app.fileSystem.addFile(app.filePath);
  }
});


// init platform specific stuff

Platform.init(process.platform, config);

// expose app
module.exports = app;
