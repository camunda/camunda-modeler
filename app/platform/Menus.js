'use strict';

var forEach = require('lodash/collection/forEach');

// Electron Modules
var Menu = require('menu');
var Ipc = require('ipc');
var app = require('app');

var menusTemplate = require('./menusTemplate');


function Menus(browserWindow, notation, positions) {
  var self = this;

  this.browserWindow = browserWindow;

  // An object with the index to specfic menus
  this.positions = positions || {};

  Ipc.on('menu.update', function(evt, updateNotation, entries) {
    if (Array.isArray(updateNotation)) {
      entries = updateNotation;
      updateNotation = undefined;
    }

    if (self.isNewNotation('edit', updateNotation)) {
      self.createMenus(updateNotation);
    }

    self.updateMenu(entries);

    browserWindow.webContents.send('menu.update.response', null);
  });

  this.createMenus(notation);
}

Menus.prototype.createMenus = function(notation) {
  var template = menusTemplate(this.browserWindow, notation);

  app.emit('editor-template-created', template);

  this.attachMenus(template, notation);
};

Menus.prototype.attachMenus = function(template, notation) {
  this.menu = Menu.buildFromTemplate(template);

  this.setNotation('edit', notation);

  Menu.setApplicationMenu(this.menu);
};

Menus.prototype.isExcluded = function(excludes, id) {
  return !!(excludes && excludes.indexOf(id) !== -1);
};

Menus.prototype.updateMenu = function (entries) {
  var menuItems = this.menu.items;

  forEach(menuItems, function(menuEntry, menuIdx) {
    var submenuItems;

    forEach(entries, function(updatedMenu) {
      if (menuEntry.id === updatedMenu.id) {
        submenuItems = menuEntry.submenu.items;

        // If data is not an array means that we want to update "all "
        // Update all data besides any that are inside an `excludes` array
        if (!Array.isArray(updatedMenu.data)) {
          this.updateMenuEntries(submenuItems, menuIdx, updatedMenu.data);
          return false;
        }
        forEach(updatedMenu.data, function(entry) {
          this.updateMenuEntry(submenuItems, menuIdx, entry.id, entry.data);
        }, this);
        return false;
      }
    }, this);
  }, this);
};

Menus.prototype.updateMenuEntries = function(menuEntry, menuIdx, data) {
  var excludes;

  if (data.excludes) {
    excludes = data.excludes;
    delete data.excludes;
  }

  forEach(menuEntry, function(existingEntry, entryIdx) {
    // Label is false when we want to apply the changes to every
    // menu entry, unless we provide a `excludes` property with
    // an array of entries that we wanna exclude from
    if (this.isExcluded(excludes, existingEntry.id) || !existingEntry.label) {
      return;
    }

    this._updateEntry(menuIdx, entryIdx, data);
  }, this);

};

Menus.prototype.updateMenuEntry = function(menuEntry, menuIdx, entryId, data) {

  forEach(menuEntry, function(existingEntry, entryIdx) {
    if (existingEntry.id === entryId) {

      this._updateEntry(menuIdx, entryIdx, data);
    }
  }, this);
};


Menus.prototype._updateEntry = function(menuIdx, entryIdx, data) {
  var menu = this.menu.items[menuIdx],
      entry = menu.submenu.items[entryIdx];

  forEach(data, function(val, property) {
    entry[property] = val;
  });
};

Menus.prototype.isNewNotation = function(menuId, notation) {
  var position = this.positions[menuId];

  return notation && this.menu.items[position].notation !== notation;
};

Menus.prototype.setNotation = function(menuId, notation) {
  var position = this.positions[menuId];

  if (!notation) {
    notation = 'bpmn';
  }
  // BPMN should be the default on init
  this.menu.items[position].notation = notation;
};


module.exports = Menus;
