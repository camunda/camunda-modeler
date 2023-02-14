/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const {
  app,
  Menu,
  MenuItem
} = require('electron');

const MenuBuilder = require('../menu-builder');


class MacMenuBuilder extends MenuBuilder {
  constructor(options) {
    super(options);
  }

  appendAppMenu() {
    const subMenu = new MacMenuBuilder({
      template: [ {
        label: 'About ' + this.options.appName,
        role: 'about'
      },
      ... (app.flags && !app.flags.get('disable-remote-interaction')) ? [
        {
          label: 'Check for Updates',
          click: () => app.emit('menu:action', 'emit-event', { type: 'updateChecks.execute' })
        }
      ] : [],
      {
        type: 'separator'
      }, {
        label: 'Services',
        role: 'services',
        submenu: []
      }, {
        type: 'separator'
      }, {
        label: 'Hide ' + this.options.appName,
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
      } ]
    }).appendQuit().get();

    this.menu.append(new MenuItem({
      label: this.options.appName,
      submenu: subMenu
    }));

    return this;
  }

  appendRedo() {
    this.menu.append(new MenuItem({
      label: 'Redo',
      enabled: this.options.state.redo,
      accelerator: 'Command+Shift+Z',
      click: function(menuItem, browserWindow) {
        app.emit('menu:action', 'redo');
      }
    }));
  }

  getWindowSubmenuTemplate() {
    const submenuTemplate = super.getWindowSubmenuTemplate();

    const fullScreenEntry = submenuTemplate.find(({ label }) => label === 'Fullscreen');

    fullScreenEntry.accelerator = 'Ctrl+Cmd+F';

    return submenuTemplate;
  }

  getHelpSubmenuTemplate() {
    let submenuTemplate = super.getHelpSubmenuTemplate();

    // remove check updates entry to avoid duplication with app menu
    submenuTemplate = submenuTemplate.filter(({ label }) => label !== 'Check for Updates');

    return submenuTemplate;
  }

  /**
   * Add Mac-specific Cmd+Shift+[/] shortcuts
   */
  appendSwitchTab(submenu) {
    this.menu.append(new MenuItem({
      label: 'Switch Tab...',
      submenu: submenu || Menu.buildFromTemplate([ {
        label: 'Select Next Tab',
        enabled: canSwitchTab(this.options.state),
        accelerator: 'Control+TAB',
        click: () => app.emit('menu:action', 'select-tab', 'next')
      },
      {
        label: 'Select Previous Tab',
        enabled: canSwitchTab(this.options.state),
        accelerator: 'Control+SHIFT+TAB',
        click: () => app.emit('menu:action', 'select-tab', 'previous')
      },
      {
        label: 'Select Next Tab',
        enabled: canSwitchTab(this.options.state),
        accelerator: 'Command+SHIFT+]',
        visible: false,
        acceleratorWorksWhenHidden: true,
        click: () => app.emit('menu:action', 'select-tab', 'next')
      },
      {
        label: 'Select Previous Tab',
        enabled: canSwitchTab(this.options.state),
        accelerator: 'Command+SHIFT+[',
        visible: false,
        acceleratorWorksWhenHidden: true,
        click: () => app.emit('menu:action', 'select-tab', 'previous')
      } ])
    }));

    this.appendSeparator();

    return this;
  }

  build() {
    this.appendAppMenu();

    super.build();

    return this;
  }
}

module.exports = MacMenuBuilder;

function canSwitchTab(state) {
  return state.tabsCount > 1;
}
