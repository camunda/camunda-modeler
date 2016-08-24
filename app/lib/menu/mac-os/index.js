'use strict';

var inherits = require('inherits');

var electron = require('electron'),
    app = electron.app,
    MenuItem = electron.MenuItem;

var MenuBuilder = require('../menu-builder');


function MacMenuBuilder(options) {
  MenuBuilder.call(this, options);
}

inherits(MacMenuBuilder, MenuBuilder);

module.exports = MacMenuBuilder;

MacMenuBuilder.prototype.appendAppMenu = function() {
  var subMenu = new MacMenuBuilder({
    template: [{
      label: 'About ' + this.opts.appName,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: 'Hide ' + this.opts.appName,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Shift+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }]
  }).appendQuit().get();

  this.menu.append(new MenuItem({
    label: this.opts.appName,
    submenu: subMenu
  }));

  return this;
};

MacMenuBuilder.prototype.appendRedo = function() {
  this.menu.append(new MenuItem({
    label: 'Redo',
    enabled: this.opts.state.redo,
    accelerator: 'Command+Shift+Z',
    click: function(menuItem, browserWindow) {
      app.emit('menu:action', 'redo');
    }
  }));
};

MacMenuBuilder.prototype.build = function() {
  this.appendAppMenu()
    .appendFileMenu(
      new this.constructor(this.opts)
      .appendNewFile()
      .appendOpen()
      .appendSeparator()
      .appendSwitchTab()
      .appendSaveFile()
      .appendSaveAsFile()
      .appendSaveAllFiles()
      .appendSeparator()
      .appendExportAs()
      .appendCloseTab()
      .appendSeparator()
      .get()
    )
    .appendEditMenu()
    .appendWindowMenu()
    .appendPluginsMenu()
    .appendHelpMenu();
  this.setMenu();

  return this;
};
