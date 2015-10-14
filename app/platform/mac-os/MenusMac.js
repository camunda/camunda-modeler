'use strict';

// Electron Modules
const Menu = require('menu');

function menus(browserWindow, fileSystem) {

  var menu = new Menu();

  var template = [
    {
      label: 'Camunda Modeler',
      submenu: [
        {
          label: 'About Camunda Modeler',
          selector: 'orderFrontStandardAboutPanel:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          selector: 'terminate:'
        },
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File..',
          accelerator: 'Command+O',
          click: function() {}
        },{
          label: 'Save File',
          accelerator: 'Command+S',
          click: function() {}
        },{
          label: 'Save File As..',
          accelerator: 'Command+Shift+S',
          click: function() {}
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          selector: 'redo:'
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          label: 'Close',
          accelerator: 'Command+W',
          selector: 'performClose:'
        },
        {
          label: 'Fullscreen',
          accelerator: 'Command+Enter',
          click: function() {
            if (browserWindow.isFullScreen()) {
              return browserWindow.setFullScreen(false);
            }

            browserWindow.setFullScreen(true);
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Command+Alt+J',
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
