'use strict';

var Menus = require('../Menus');

var app = require('app');

var map = require('lodash/collection/map'),
    findIndex = require('lodash/array/findIndex'),
    find = require('lodash/collection/find');

var MODELER_NAME = 'Camunda Modeler';


function appMenu() {
  return {
    submenu: [
      {
        label: 'About ' + MODELER_NAME,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + MODELER_NAME,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() {
          app.quit();
        }
      },
    ]
  };
}

app.on('editor-template-created', function(template) {
  template.unshift(appMenu());

  template = editFileMenu(template);
});

function MenusMac(browserWindow, notation, position) {
  new Menus(browserWindow, notation, position);
}

function editFileMenu(template) {
  return map(template, function(menu, menuIdx) {
    var entryIdx;

    if (menu.id === 'edit') {
      var redoMenu = find(menu.submenu, { id: 'redo' });
      redoMenu.accelerator = 'CommandOrControl+Shift+Z';
    }

    if (menu.id === 'file') {
      entryIdx = findIndex(menu.submenu, { id: 'quit' });

      if (entryIdx) {
        template[menuIdx].submenu.splice(entryIdx, 1);
      }
    }
    return menu;
  });
}

module.exports = MenusMac;
