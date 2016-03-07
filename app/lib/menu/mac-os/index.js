'use strict';

var inherits = require('inherits');

var MenuItem = require('menu-item');

var MenuBuilder = require('../MenuBuilder');


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
    click: function (menuItem, browserWindow) {
      browserWindow.webContents.send('menu:action', 'redo');
    }
  }));
};

MacMenuBuilder.prototype.build = function() {
  this.appendAppMenu()
    .appendFileMenu(
      new this.constructor(this.opts)
      .appendNewFile()
      .appendOpenFile()
      .appendSeparator()
      .appendSaveFile()
      .appendSaveAsFile()
      .appendSaveAllFiles()
      .appendSeparator()
      .appendCloseTab()
      .get()
    )
    .appendEditMenu()
    .appendWindowMenu()
    .appendHelpMenu();
  this.setMenu();

  return this;
};
