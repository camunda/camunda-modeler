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

const {
  assign,
  find,
  isFunction,
  map,
  merge
} = require('min-dash');

const browserOpen = require('../util/browser-open');

const log = require('../log')('app:menu');


class MenuBuilder {
  constructor(options) {
    this.options = merge({
      appName: app.name,
      state: {
        save: false,
        exportAs: false,
        development: process.env.NODE_ENV === 'development',
        devtools: false
      },
      providers: {}
    }, options);

    if (this.options.template) {
      this.menu = Menu.buildFromTemplate(this.options.template);
    } else {
      this.menu = new Menu();
    }
  }

  build() {
    this.appendFileMenu(
      new MenuBuilder(this.options)
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
        .appendQuit()
        .get()
    );

    if ('editMenu' in this.options.state) {
      this.appendEditMenu();
    }

    this.appendWindowMenu();
    this.appendPluginsMenu();
    this.appendHelpMenu();

    return this;
  }

  buildContextMenu() {
    const { contextMenu } = this.options.state;

    if (this.options.type === 'tab') {
      return this.appendNewFile()
        .appendSeparator()
        .appendContextCloseTab()
        .appendSeparator()
        .appendReopenLastTab();
    }

    if (contextMenu) {
      this.menu = Menu.buildFromTemplate(contextMenu.map(mapMenuEntryTemplate));

      return this;
    }
  }

  setMenu() {
    Menu.setApplicationMenu(this.menu);

    return this;
  }

  openPopup() {
    this.menu.popup({});
  }

  appendFileMenu(submenu) {
    this.menu.append(new MenuItem({
      label: 'File',
      submenu: submenu
    }));

    return this;
  }

  appendNewFile() {
    const submenuTemplate = this.getNewFileSubmenuTemplate();

    this.menu.append(new MenuItem({
      label: 'New File',
      submenu: Menu.buildFromTemplate(submenuTemplate)
    }));

    return this;
  }

  getNewFileSubmenuTemplate() {
    const providedMenus = map(this.options.providers, provider => provider.newFileMenu)
      .filter(menu => Boolean(menu.length));

    if (!providedMenus.length) {
      return [{
        label: 'Empty',
        enabled: false
      }];
    }

    const template = providedMenus.reduce((newFileMenus, current) => {
      return [
        ...newFileMenus,
        ...current.map(mapMenuEntryTemplate),
      ];
    }, []);

    return template;
  }

  appendOpen() {
    this.menu.append(new MenuItem({
      label: 'Open File...',
      accelerator: 'CommandOrControl+O',
      click: function() {
        app.emit('menu:action', 'open-diagram');
      }
    }));

    this.appendReopenLastTab();

    return this;
  }

  appendReopenLastTab() {
    this.menu.append(new MenuItem({
      label: 'Reopen Last File',
      enabled: this.options.state.lastTab,
      accelerator: 'CommandOrControl+Shift+T',
      click: function() {
        app.emit('menu:action', 'reopen-last-tab');
      }
    }));

    return this;
  }

  appendSaveFile() {
    this.menu.append(new MenuItem({
      label: 'Save File',
      enabled: this.options.state.save,
      accelerator: 'CommandOrControl+S',
      click: function() {
        app.emit('menu:action', 'save');
      }
    }));

    return this;
  }

  appendSaveAsFile() {
    this.menu.append(new MenuItem({
      label: 'Save File As..',
      accelerator: 'CommandOrControl+Shift+S',
      enabled: this.options.state.save,
      click: function() {
        app.emit('menu:action', 'save-as');
      }
    }));

    return this;
  }

  appendSaveAllFiles() {
    this.menu.append(new MenuItem({
      label: 'Save All Files',
      accelerator: 'CommandOrControl+Alt+S',
      enabled: this.options.state.save,
      click: function() {
        app.emit('menu:action', 'save-all');
      }
    }));

    return this;
  }

  appendExportAs() {
    const exportState = this.options.state.exportAs;
    const enabled = exportState && exportState.length > 0;

    this.menu.append(new MenuItem({
      label: 'Export As Image',
      enabled: enabled,
      click: function() {
        app.emit('menu:action', 'export-as', exportState || []);
      }
    }));

    this.appendSeparator();

    return this;
  }

  appendCloseTab() {
    this.menu.append(new MenuItem({
      label: 'Close Tab',
      enabled: canCloseTab(this.options.state),
      accelerator: 'CommandOrControl+W',
      click: function() {
        app.emit('menu:action', 'close-active-tab');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close All Tabs',
      enabled: canCloseTab(this.options.state),
      click: function() {
        app.emit('menu:action', 'close-all-tabs');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close Other Tabs',
      enabled: canSwitchTab(this.options.state),
      click: function() {
        app.emit('menu:action', 'close-other-tabs');
      }
    }));

    return this;
  }

  appendSwitchTab(submenu) {
    this.menu.append(new MenuItem({
      label: 'Switch Tab..',
      submenu: submenu || Menu.buildFromTemplate([{
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
      }])
    }));

    this.appendSeparator();

    return this;
  }

  appendQuit() {
    this.menu.append(new MenuItem({
      label: 'Quit',
      accelerator: 'CommandOrControl+Q',
      click: function() {
        app.emit('app:quit');
      }
    }));

    return this;
  }

  appendMenuItem(builder, menuItem) {
    const {
      accelerator,
      action,
      enabled,
      label,
      options,
      role,
      submenu,
      visible
    } = menuItem;

    let menuItemOptions = {
      accelerator,
      enabled,
      label,
      role,
      visible
    };

    if (action) {
      menuItemOptions = {
        ...menuItemOptions,
        click: () => app.emit('menu:action', action, options)
      };
    }

    if (submenu) {
      menuItemOptions = {
        ...menuItemOptions,
        submenu: Menu.buildFromTemplate(menuItem.submenu.map(mapMenuEntryTemplate))
      };
    }

    builder.menu.append(new MenuItem(menuItemOptions));
  }

  getEditMenu(menuItems) {
    const builder = new MenuBuilder(this.options);

    menuItems.forEach((menuItem, index) => {
      if (Array.isArray(menuItem)) {
        if (index !== 0) {
          builder.appendSeparator();
        }
        menuItem.forEach((menuItem) => {
          this.appendMenuItem(builder, menuItem);
        });
      }
      else {
        this.appendMenuItem(builder, menuItem);
      }
    });

    return builder.get();
  }

  appendEditMenu() {
    let subMenu;

    if (this.options.state.editMenu) {
      subMenu = this.getEditMenu(this.options.state.editMenu, this.options);
    }

    this.menu.append(new MenuItem({
      label: 'Edit',
      submenu: subMenu
    }));

    return this;
  }

  appendWindowMenu() {
    if (!app.mainWindow) {
      return this;
    }

    const submenuTemplate = this.getWindowSubmenuTemplate();

    this.menu.append(new MenuItem({
      label: 'Window',
      submenu: Menu.buildFromTemplate(submenuTemplate)
    }));

    return this;
  }

  getWindowSubmenuTemplate() {
    const submenuTemplate = [];

    if (this.options.state.windowMenu) {
      submenuTemplate.push(
        ...this.options.state.windowMenu.map(mapMenuEntryTemplate),
        getSeparatorTemplate()
      );
    }

    if (this.options.state.development || this.options.state.devtools) {
      submenuTemplate.push({
        label: 'Reload',
        accelerator: 'CommandOrControl+R',
        click: (_, browserWindow) => browserWindow.reload()
      });
    }

    submenuTemplate.push({
      label: 'Toggle DevTools',
      accelerator: 'F12',
      click: (_, browserWindow) => {
        const isDevToolsOpened = browserWindow.isDevToolsOpened();

        if (isDevToolsOpened) {
          app.mainWindow.once('devtools-closed', () => {
            app.emit('menu:update', assign({}, this.options.state, {
              devtools: false
            }));
          });
          browserWindow.closeDevTools();
        }
        else {
          app.mainWindow.once('devtools-opened', () => {
            app.emit('menu:update', assign({}, this.options.state, {
              devtools: true
            }));
          });
          browserWindow.openDevTools();
        }
      }
    }, {
      label: 'Fullscreen',
      accelerator: 'F11',
      click: (_, browserWindow) => {
        const isFullScreen = browserWindow.isFullScreen();

        browserWindow.setFullScreen(!isFullScreen);
      }
    });

    return submenuTemplate;
  }

  appendPluginsMenu() {
    const provider = find(this.options.providers, provider => provider.plugins);

    const plugins = provider && provider.plugins || [];

    // do not append menu, if no plug-ins are installed
    if (!plugins.length) {
      return this;
    }

    // construct sub-menus for each plug-in
    const submenuTemplate = plugins.map(plugin => {
      const { name } = plugin;

      const menuItemDescriptor = {
        label: name,
        enabled: false
      };

      if (plugin.menu) {

        try {
          const menuEntries = plugin.menu(app, this.options.state);

          menuItemDescriptor.enabled = true;
          menuItemDescriptor.submenu = Menu.buildFromTemplate(
            menuEntries.map((entry) => {

              const {
                accelerator,
                action,
                enabled,
                label,
                submenu,
                visible
              } = entry;

              return new MenuItem({
                label,
                accelerator,
                enabled: isFunction(enabled) ? Boolean(enabled()) : enabled,
                click: action && wrapPluginAction(action, name),
                submenu,
                visible
              });
            })
          );
        } catch (error) {
          plugin.error = true;
          menuItemDescriptor.enabled = false;

          log.error('[%s] Failed to build menu: %O', name, error);
        }
      }

      if (plugin.error) {
        menuItemDescriptor.label = menuItemDescriptor.label.concat(' <error>');
      }

      return new MenuItem(menuItemDescriptor);
    });

    // create actual menu entry, based on previously
    // constructed sub-menus
    this.menu.append(new MenuItem({
      label: 'Plugins',
      submenu: Menu.buildFromTemplate(submenuTemplate)
    }));

    return this;
  }

  appendHelpMenu() {
    const submenuTemplate = this.getHelpSubmenuTemplate();

    this.menu.append(new MenuItem({
      label: 'Help',
      submenu: Menu.buildFromTemplate(submenuTemplate)
    }));

    return this;
  }

  getHelpSubmenuTemplate() {
    const topPart = [
      {
        label: 'Documentation',
        click: () => browserOpen('https://docs.camunda.org/manual/latest/modeler/camunda-modeler')
      },
      {
        label: 'User Forum',
        click: () => browserOpen('https://forum.camunda.org/c/modeler')
      },
      {
        label: 'Keyboard Shortcuts',
        click: () => app.emit('menu:action', 'show-shortcuts')
      },
      getSeparatorTemplate(),
      {
        label: 'Search Feature Requests',
        click: () => browserOpen('https://github.com/camunda/camunda-modeler/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement')
      },
      {
        label: 'Report Issue',
        click: () => browserOpen('https://github.com/camunda/camunda-modeler/issues/new/choose')
      },
      ... (app.flags && !app.flags.get('disable-remote-interaction')) ? [
        getSeparatorTemplate(),
        {
          label: 'Privacy Preferences',
          click: () => app.emit('menu:action', 'emit-event', { type: 'show-privacy-preferences' })
        },
        {
          label: 'Check for Updates',
          click: () => app.emit('menu:action', 'emit-event', { type: 'updateChecks.execute' })
        },
      ] : [],
      getSeparatorTemplate()
    ];

    const providedMenus = map(this.options.providers, provider => provider.helpMenu)
      .filter(menu => Boolean(menu.length));

    const middlePart = providedMenus.reduce((helpMenus, current) => {
      return [
        ...helpMenus,
        ...current.map(mapHelpMenuTemplate),
        getSeparatorTemplate()
      ];
    }, []);

    const bottomPart = [
      {
        label: 'Version ' + app.version,
        enabled: false
      }
    ];

    return [
      ...topPart,
      ...middlePart,
      ...bottomPart
    ];
  }

  appendSeparator() {
    this.menu.append(new MenuItem({
      type: 'separator'
    }));
    return this;
  }

  appendContextCloseTab() {
    const attrs = this.options.attrs;

    this.menu.append(new MenuItem({
      label: 'Close Tab',
      enabled: canCloseTab(this.options.state),
      accelerator: 'CommandOrControl+W',
      click: function() {
        app.emit('menu:action', 'close-tab', attrs);
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close All Tabs',
      enabled: canCloseTab(this.options.state),
      click: function() {
        app.emit('menu:action', 'close-all-tabs');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close Other Tabs',
      enabled: canSwitchTab(this.options.state),
      click: function() {
        app.emit('menu:action', 'close-other-tabs', attrs);
      }
    }));

    return this;
  }

  get() {
    return this.menu;
  }
}

module.exports = MenuBuilder;



// helpers //////
function mapMenuEntryTemplate(entry) {
  if (entry.type === 'separator') {
    return getSeparatorTemplate();
  }

  return {
    label: entry.label,
    accelerator: entry.accelerator,
    enabled: entry.enabled !== undefined ? entry.enabled : true,
    click: () => app.emit('menu:action', entry.action, entry.options),
  };
}

function mapHelpMenuTemplate(menu) {
  return {
    label: menu.label,
    click: () => browserOpen(menu.action)
  };
}

function getSeparatorTemplate() {
  return {
    type: 'separator'
  };
}

function canSwitchTab(state) {
  return state.tabsCount > 1;
}

function canCloseTab(state) {
  return Boolean(state.tabsCount);
}

function wrapPluginAction(fn, pluginName) {
  return async function() {
    try {
      await fn();
    } catch (error) {
      log.error('[%s] Menu action error: %O', pluginName, error);
    }
  };
}
