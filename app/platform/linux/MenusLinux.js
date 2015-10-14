'use strict';

// Electron Modules
const Menu = require('menu');
const electron = require('app');


function menus(browserWindow, fileSystem) {

  var menu = new Menu();

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
          click: function() {}
        }, {
          label: 'Save File',
          accelerator: 'Control+S',
          click: function() {}
        }, {
          label: 'Save File As..',
          accelerator: 'Control+Shift+S',
          click: function() {}
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
