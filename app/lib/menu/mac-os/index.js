'use strict';

var inherits = require('inherits');
var MenuItem = require('menu-item');
var MenuBuilder = require('../MenuBuilder');

var MacMenuBuilder = module.exports = function MacMenuBuilder(options) {
  MenuBuilder.call(this, options);
};

inherits(MacMenuBuilder, MenuBuilder);

MacMenuBuilder.prototype.appendAppMenu = function () {
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

MacMenuBuilder.prototype.newFile = function() {
  return new MenuItem({
    id: 'redo',
    label: 'Redo',
    accelerator: 'CommandOrControl+Shift+Z',
    click: function (menuItem, win) {
      win.webContents.send('editor:redo');
    }
  });
};

MacMenuBuilder.prototype.appendRedo = function () {
  this.menu.append(new MenuItem({
    id: 'redo',
    label: 'Redo',
    accelerator: 'CommandOrControl+Shift+Z',
    click: function (menuItem, win) {
      win.webContents.send('editor:redo');
    }
  }));
};

MacMenuBuilder.prototype.build = function () {
  this.appendAppMenu()
    .appendFileMenu(
      new MacMenuBuilder()
      .appendNewFile()
      .appendOpenFile()
      .appendSeparator()
      .appendSaveFile()
      .appendSaveAsFile()
      .appendSeparator()
      .appendCloseTab()
      .get()
    )
    .appendEditMenu(
      new MenuBuilder()
      .appendBaseEditActions()
      .appendBpmnActions()
      .appendDmnActions()
      .get()
    )
    .appendWindowMenu()
    .appendHelpMenu();
  this.setMenu();
  return this;
};