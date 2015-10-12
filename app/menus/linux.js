'use strict';

// Electron Modules
const Menu = require('menu');
const dialog = require('dialog');
const electron = require('app');

// Services
const File = require('../file');


function saveFile(title, browserWindow, file) {
  dialog.showSaveDialog(browserWindow, {
      title: title,
      filters: [
        { name: 'Bpmn', extensions: ['bpmn'] },
      ]
    }, function(filename) {
      if (filename) {
        file.set(filename);

        browserWindow.webContents.send('file.save');
      }
  });
}

function menus(browserWindow, desktopPath) {

  var menu = new Menu();

  var file = new File();

  var template = [
    {
      label: 'Camunda Modeler',
      submenu: [
        {
          label: 'About Camunda Modeler'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Control+Q',
          click: function() {
            electron.quit();
          }
        },
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File..',
          accelerator: 'Control+O',
          click: function() {
            dialog.showOpenDialog(browserWindow, {
                title: 'Open bpmn file',
                defaultPath: desktopPath,
                properties: ['openFile'],
                filters: [
                  { name: 'Bpmn', extensions: ['.bpmn'] },
                ]
              }, function(filenames) {
                if (filenames) {
                  file.open(browserWindow, filenames);
                }
              });
          }
        }, {
          label: 'Save File',
          accelerator: 'Control+S',
          click: function() {
            var filename;

            if ((filename = file.get())) {
              return browserWindow.webContents.send('file.save');
            }
            saveFile('Save file', browserWindow, file);
          }
        }, {
          label: 'Save File As..',
          accelerator: 'Control+Shift+S',
          click: function() {
            saveFile('Save file as..', browserWindow, file);
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Control+Z'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Control+Z'
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Control+M',
          click: function() {
            browserWindow.minimize();
          }
        },
        {
          label: 'Reload',
          accelerator: 'Control+R',
          click: function() {
            browserWindow.reload();
          }
        },
        {
          label: 'Fullscreen',
          accelerator: 'F11',
          click: function() {
            if (browserWindow.isFullScreen()) {
              return browserWindow.setFullScreen(false);
            }

            browserWindow.setFullScreen(true);
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: function() {
            browserWindow.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: []
    }
  ];

  menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}

module.exports = menus;
