'use strict';

const path = require('path');

const electron = require('app');
const browserWindow = require('electron-window');
const shell = require('shell');

// report crashes to the Electron project
require('crash-reporter').start();

var mainWindow;

function onReady(win, desktopPath) {
  const menus = require('./app/menus');

  menus(win, desktopPath);
}

function createWin(callback) {
  mainWindow = browserWindow.createWindow({
    resizable: true,
    title: 'Camunda Modeler'
  });

  mainWindow.maximize();

  var indexPath = path.resolve(__dirname, 'index.html');

  mainWindow.showUrl(indexPath, function () {
    callback(mainWindow, electron.getPath('userDesktop'));
  });

  mainWindow.webContents.on('will-navigate', function(evt, url) {
    evt.preventDefault();

    shell.openExternal(url);
  });

  return mainWindow;
}

electron.on('open-url', function(evt) {
  evt.preventDefault();
});

electron.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		electron.quit();
	}
});

electron.on('activate-with-no-open-windows', function () {
	if (!mainWindow) {
		mainWindow = createWin(onReady);
	}
});

electron.on('ready', function (evt) {
	mainWindow = createWin(onReady);
});
