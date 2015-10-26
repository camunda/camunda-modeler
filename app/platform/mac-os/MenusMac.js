'use strict';

var Menus = require('../Menus');

var app = require('app');

var map = require('lodash/collection/map'),
    findIndex = require('lodash/array/findIndex');

var MODELER_NAME = 'Camunda Modeler';


var appMenu = {
  label: MODELER_NAME,
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


app.on('editor-template-created', function(template) {
  template.unshift(appMenu);

  template = editFileMenu(template);
});

function MenusMac(browserWindow) {
  new Menus(browserWindow);
}

function editFileMenu(template) {
  return map(template, function(menu, menuIdx) {
    var entryIdx;

    if (menu.label === 'File') {
      entryIdx = findIndex(menu.submenu, { label: 'Quit' });

      if (entryIdx) {
        template[menuIdx].submenu.splice(entryIdx, 1);
      }
    }
    return menu;
  });
}

module.exports = MenusMac;
