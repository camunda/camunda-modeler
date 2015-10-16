'use strict';

var path = require('path');

var BrowserWindow = require('electron-window');
var Shell = require('shell');

/**
 * automatically report crash reports
 *
 * @see http://electron.atom.io/docs/v0.33.0/api/crash-reporter/
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

  console.log(indexPath);

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

app.on('open-url', function(evt) {
  evt.preventDefault();
});

app.on('activate-with-no-open-windows', function() {
  open();
});

app.on('ready', function(evt) {
  open();
});

app.on('editor-open', function(mainWindow) {
  var fileSystem = new FileSystem(mainWindow);

  app.emit('editor-create-menu', mainWindow, fileSystem);
});


// init platform specific stuff

Platform.init(process.platform, app, config);

// expose app
module.exports = app;