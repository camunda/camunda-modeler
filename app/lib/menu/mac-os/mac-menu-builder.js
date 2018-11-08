'use strict';

const {
  app,
  MenuItem
} = require('electron');

const MenuBuilder = require('../menu-builder');


class MacMenuBuilder extends MenuBuilder {
  constructor(options) {
    super(options);
  }

  appendAppMenu() {
    const subMenu = new MacMenuBuilder({
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
  }

  appendRedo() {
    this.menu.append(new MenuItem({
      label: 'Redo',
      enabled: this.opts.state.redo,
      accelerator: 'Command+Shift+Z',
      click: function(menuItem, browserWindow) {
        app.emit('menu:action', 'redo');
      }
    }));
  }

  build() {
    this.appendAppMenu()
      .appendFileMenu(new this.constructor(this.opts)
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
        .get())
      .appendEditMenu()
      .appendWindowMenu()
      .appendPluginsMenu()
      .appendHelpMenu();

    this.setMenu();

    return this;
  }
}

module.exports = MacMenuBuilder;
