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

const electron = require('electron');
const path = require('path');

const {
  app,
  Menu,
  MenuItem
} = electron;

const {
  assign,
  find,
  filter,
  flatten,
  groupBy,
  isFunction,
  keys,
  map,
  merge,
  reduce
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
        devtools: false,
        lastTab: false,
        closedTabs: [],
        tabs: [],
        activeTab: null
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
    const MenuBuilder = this.constructor;

    this.appendFileMenu(
      new MenuBuilder(this.options)
        .appendNewFile()
        .appendNewProcessApplication()
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
        .appendSettings()
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
      return this.appendContextCloseTab()
        .appendSeparator()
        .appendContextRevealInFileExplorerTab();
    }

    if (contextMenu) {
      this.menu = Menu.buildFromTemplate(expandMenuEntriesTemplate(contextMenu));

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
    let submenuTemplate = this.getNewFileSubmenuTemplate();

    // add dropdown shortcut
    submenuTemplate = [
      ...submenuTemplate,
      {
        label: 'Open new file options...',
        accelerator: 'CommandOrControl+N',
        click: () => app.emit('menu:action', 'emit-event', { type: 'createNewAction.open' })
      }
    ];

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
      return [ {
        label: 'Empty',
        enabled: false
      } ];
    }

    const groups = groupBy(flatten(providedMenus), 'group');

    // (1) handle per group
    if (keys(groups).length > 1) {
      return reduce(groups, (newFileMenus, current, group) => {
        return [
          ...newFileMenus,

          // as long we can't have sub menu titles, use extended labels
          ...map(current, entry => {
            return mapMenuEntryTemplate({
              ...entry,
              label: `${entry.label} (${group})`
            });
          }),
          getSeparatorTemplate()
        ];
      }, []);
    }

    // (2) handle flat menu
    return reduce(providedMenus, (newFileMenus, current) => {
      return [
        ...newFileMenus,
        ...map(current, mapMenuEntryTemplate),
      ];
    }, []);
  }

  appendOpen() {
    this.menu.append(new MenuItem({
      label: 'Open File...',
      accelerator: 'CommandOrControl+O',
      click: function() {
        app.emit('menu:action', 'open-diagram');
      }
    }));

    this.appendOpenRecent();

    return this;
  }

  appendOpenRecent() {
    this.menu.append(new MenuItem({
      label: 'Open Recent',
      enabled: true,
      submenu: Menu.buildFromTemplate([
        {
          label: 'Reopen Last File',
          enabled: this.options.state.lastTab,
          accelerator: 'CommandOrControl+Shift+T',
          click: function() {
            app.emit('menu:action', 'reopen-last-tab');
          }
        },
        getSeparatorTemplate(),
        ...(this.options.state.closedTabs.slice()
          .reverse()
          .map((tab) => {
            return {
              label: tab.file.path,
              enabled: true,
              click: () => app.emit('menu:action', 'reopen-file', tab)
            };
          }))
      ])
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

  appendNewProcessApplication() {
    this.menu.append(new MenuItem({
      label: 'New Process Application...',
      click: function() {
        app.emit('menu:action', 'emit-event', { type: 'create-process-application' });
      }
    }));

    return this;
  }

  appendExportAs() {
    const exportState = this.options.state.exportAs;
    const enabled = exportState && exportState.length > 0;

    this.menu.append(new MenuItem({
      label: 'Export As Image',
      accelerator: 'CommandOrControl+Shift+E',
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
      }
      ])
    }));

    this.appendSeparator();

    return this;
  }

  appendSettings() {
    this.menu.append(new MenuItem({
      label: 'Settings',
      accelerator: 'CommandOrControl+,',
      click: function() {
        app.emit('menu:action', 'settings-open');
      }
    }));

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
        click: wrapActionInactiveInDevtools((...args) => {

          const event = args[2];

          app.emit('menu:action', action, {
            ...options,
            triggeredByShortcut: event.triggeredByAccelerator
          });
        })
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

    submenuTemplate.push({
      label: 'Reload',
      accelerator: 'CommandOrControl+R',
      click: () => app.emit('menu:action', 'reload-modeler')
    });

    submenuTemplate.push({
      label: 'Toggle Bottom Panel',
      accelerator: 'CommandOrControl+B',
      click: () => app.emit('menu:action', 'toggle-panel')
    }, {
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
                click: action && wrapActionInactiveInDevtools(wrapPluginAction(action, name)),
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
        click: () => browserOpen('https://docs.camunda.io/docs/components/modeler/desktop-modeler/?utm_source=modeler&utm_medium=referral')
      },
      {
        label: 'User Forum',
        click: () => browserOpen('https://forum.camunda.io/c/bpmn-modeling/?utm_source=modeler&utm_medium=referral')
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
        click: () => app.emit('menu:action', 'emit-event', { type: 'reportFeedback.open' })
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

      // check for duplicates
      const withoutDuplicates = filter(current, e => !findHelpMenuEntry(helpMenus, e));

      if (!withoutDuplicates.length) {
        return helpMenus;
      }

      return [
        ...helpMenus,
        ...withoutDuplicates.map(mapHelpMenuTemplate),
        getSeparatorTemplate()
      ];
    }, []);

    const bottomPart = [
      {
        label: 'FEEL Reference',
        click: () => browserOpen('https://docs.camunda.io/docs/components/modeler/feel/what-is-feel/?utm_source=modeler&utm_medium=referral')
      },
      getSeparatorTemplate(),
      {
        label: 'Version ' + app.version,
        enabled: false
      },
      {
        label: 'What\'s new',
        click: () => app.emit('menu:action', 'emit-event', { type: 'versionInfo.open' })
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

  appendContextRevealInFileExplorerTab() {
    const attrs = this.options.attrs,
          tabs = this.options.state.tabs,
          tabId = attrs.tabId;

    const filePath = tabs.find(t => t.id === tabId).file.path;

    this.menu.append(new MenuItem({
      label: 'Reveal in File Explorer',
      enabled: !!filePath,
      click: function() {
        app.emit('menu:action', 'reveal-in-file-explorer', {
          filePath
        });
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

/**
 * @param { (MenuEntry[]|MenuEntry)[]} entries
 *
 * @return { ExpandedMenuEntry[] }
 */
function expandMenuEntriesTemplate(entries) {

  return entries.reduce((expandedEntries, entries) => {

    if (Array.isArray(entries)) {
      if (expandedEntries.length && entries.length) {

        // prepend separator
        entries = [
          { type: 'separator' },
          ...entries
        ];
      }
    } else {
      entries = [ entries ];
    }

    return expandedEntries.concat(entries.map(mapMenuEntryTemplate));
  }, []);
}


function mapMenuEntryTemplate(entry) {
  if (entry.type === 'separator') {
    return getSeparatorTemplate();
  }

  return {
    label: entry.label,
    accelerator: entry.accelerator,
    enabled: entry.enabled !== undefined ? entry.enabled : true,
    click: (...args) => {
      const event = args[2];

      const options = {
        ...entry.options,
        triggeredByShortcut: event.triggeredByAccelerator
      };

      app.emit('menu:action', entry.action, options);
    },
    icon: entry.icon ?
      getIconImage(entry.icon)
      : null
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
  return state.tabs.length > 1;
}

function canCloseTab(state) {
  return Boolean(state.tabs.length);
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

function wrapActionInactiveInDevtools(fn) {

  /**
   * @param {*} _
   * @param {import('electron').BrowserWindow | undefined} focusedWindow
   * @param {import('electron').KeyboardEvent} event
   */
  function wrapped(_, focusedWindow, event) {
    if (event.triggeredByAccelerator && !focusedWindow) {
      return;
    }

    fn.apply(null, arguments);
  }

  return wrapped;
}

function getIconImage(iconPath) {
  iconPath = path.join(__dirname, '/../../', iconPath);
  return electron.nativeImage.createFromPath(iconPath).resize({ width:12, height:12 });
}

function findHelpMenuEntry(helpMenus, entry) {
  return find(helpMenus, (menu) => entry.label === menu.label);
}
