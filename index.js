'use strict';

const path = require('path');

const electron = require('app');
const browserWindow = require('electron-window');
const client = require('electron-connect').client;
const shell = require('shell');
const dialog = require('dialog');

const os = require('os');
const fs = require('fs');
const exec = require('child_process').execSync;

const winUtil = require('./utils/windowsUtil');

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
		client.create(createWin(onReady));
	}
});

electron.on('ready', function (evt) {
  var exePath = electron.getPath('exe');

  client.create(createWin(onReady));

  if (os.platform() === 'win32') {
    setupWindows(exePath);
  }
});

function setupWindows(exePath) {
  var query = winUtil.queryRegistry().toString(),
      escapedExePath = exePath.replace(/\\/g, '\\\\');

  var hasExePath = new RegExp(escapedExePath, 'ig').test(query);
  var hasNoKey = new RegExp('The system was unable to find the specified registry key or value\.', 'gi').test(query);

  // Prompt user for file association, whenever:
  // - we cant't find association
  //  if exePath doesn't match
  // - check config file

  if (hasNoKey || !hasExePath) {
    loadConfigFile(function(config) {
      if (config && config.fileAssociation === false) {
        return;
      }

      suggestFileAssociation(exePath);
    });
  }
}

function suggestFileAssociation(exePath) {
  promptUser('Do you want to associate your .bpmn files to the Camunda Modeler ?', function(answer) {
    // answer returns the buttons array's index
    if (answer === 0) {
      winUtil.addToRegistry(exePath);
      persistAnswer(true);
    } else {
      persistAnswer(false);
    }
  });
}

function promptUser(message, callback) {
  dialog.showMessageBox({
    type: 'question',
    buttons: [ 'Yes', 'No' ],
    title: 'Camunda Modeler',
    message: message
  }, callback);
}

function persistAnswer(answer) {
  loadConfigFile(function(config, configPath) {
    if (!config) {
      fs.writeFile(configPath, JSON.stringify({ fileAssociation: answer }), { encoding: 'utf8' }, function() {});
    }
  });
}

function loadConfigFile(callback) {
  var userDataPath = electron.getPath('userData'),
      configPath = path.join(userDataPath, 'config.json');

  fs.readFile(configPath, { encoding: 'utf8' }, function(err, data) {
    if (err && err.code === 'ENOENT') {
      return callback(false, configPath);
    } else if (err) {
      return;
    } else {
      return callback(JSON.parse(data), configPath);
    }
  });
}
