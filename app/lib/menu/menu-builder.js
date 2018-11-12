'use strict';

const {
  app,
  Menu,
  MenuItem
} = require('electron');

const browserOpen = require('../util/browser-open');

const {
  assign,
  merge
} = require('min-dash');


class MenuBuilder {
  constructor(options) {
    this.options = merge({
      appName: app.name,
      state: {
        activeEditor: null,
        undo: false,
        redo: false,
        copy: false,
        paste: false,
        zoom: false,
        save: false,
        close: false,
        exportAs: false,
        development: app.developmentMode,
        devtools: false
      },
      plugins: []
    }, options);

    if (this.options.template) {
      this.menu = Menu.buildFromTemplate(this.options.template);
    } else {
      this.menu = new Menu();
    }
  }

  appendAppMenu() {
    return this;
  }

  appendFileMenu(submenu) {
    this.menu.append(new MenuItem({
      label: 'File',
      submenu: submenu
    }));

    return this;
  }

  appendNewFile() {
    this.menu.append(new MenuItem({
      label: 'New File',
      submenu: Menu.buildFromTemplate([{
        label: 'BPMN Diagram',
        accelerator: 'CommandOrControl+T',
        click: function() {
          app.emit('menu:action', 'create-bpmn-diagram');
        }
      }, {
        label: 'DMN Table',
        click: function() {
          app.emit('menu:action', 'create-dmn-table');
        }
      }, {
        label: 'DMN Diagram',
        click: function() {
          app.emit('menu:action', 'create-dmn-diagram');
        }
      }, {
        label: 'CMMN Diagram',
        click: function() {
          app.emit('menu:action', 'create-cmmn-diagram');
        }
      }])
    }));

    return this;
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
        app.emit('menu:action', 'export-tab', exportState || []);
      }
    }));

    this.appendSeparator();

    return this;
  }

  appendCloseTab() {
    this.menu.append(new MenuItem({
      label: 'Close Tab',
      enabled: this.options.state.close,
      accelerator: 'CommandOrControl+W',
      click: function() {
        app.emit('menu:action', 'close-active-tab');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close All Tabs',
      enabled: this.options.state.close,
      click: function() {
        app.emit('menu:action', 'close-all-tabs');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close Other Tabs',
      enabled: this.options.state.close,
      click: function() {
        app.emit('menu:action', 'close-other-tabs');
      }
    }));

    return this;
  }

  // todo(ricardo): add a proper state check for switching tabs
  appendSwitchTab(submenu) {
    this.menu.append(new MenuItem({
      label: 'Switch Tab..',
      submenu: submenu || Menu.buildFromTemplate([{
        label: 'Select Next Tab',
        enabled: this.options.state.close,
        accelerator: 'Control+TAB',
        click: function() {
          app.emit('menu:action', 'select-tab', 'next');
        }
      },
      {
        label: 'Select Previous Tab',
        enabled: this.options.state.close,
        accelerator: 'Control+SHIFT+TAB',
        click: function() {
          app.emit('menu:action', 'select-tab', 'previous');
        }
      }])
    }));

    this.appendSeparator();

    return this;
  }

  appendQuit(submenu) {
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
    let submenu;

    if (menuItem.submenu) {
      submenu = Menu.buildFromTemplate(menuItem.submenu.map(submenuEntry => {
        return assign(submenuEntry, {
          click: function() {
            app.emit('menu:action', submenuEntry.action, submenuEntry.options);
          }
        });
      }));
    }

    builder.menu.append(new MenuItem({
      label: menuItem.label,
      accelerator: menuItem.accelerator,
      enabled: menuItem.enabled !== undefined ? menuItem.enabled : true,
      click: function() {
        app.emit('menu:action', menuItem.action, menuItem.options);
      },
      submenu: submenu
    }));
  }

  getEditMenu(menuItems) {
    const builder = new this.constructor(this.options);

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
    const submenu = [];

    if (this.options.state.zoom) {
      submenu.push({
        label: 'Zoom In',
        accelerator: 'CommandOrControl+=',
        click: function() {
          app.emit('menu:action', 'zoomIn');
        }
      }, {
        label: 'Zoom Out',
        accelerator: 'CommandOrControl+-',
        click: function() {
          app.emit('menu:action', 'zoomOut');
        }
      }, {
        label: 'Zoom to Actual Size',
        accelerator: 'CommandOrControl+0',
        click: function() {
          app.emit('menu:action', 'zoom');
        }
      }, {
        label: 'Zoom to Fit Diagram',
        accelerator: 'CommandOrControl+1',
        click: function() {
          app.emit('menu:action', 'zoomFit');
        }
      }, {
        type: 'separator'
      });
    }

    submenu.push({
      label: 'Toggle Properties Panel',
      accelerator: 'CommandOrControl+P',
      click: function() {
        app.emit('menu:action', 'toggleProperties');
      }
    }, {
      label: 'Reset Properties Panel',
      accelerator: 'CommandOrControl+Shift+P',
      click: function() {
        app.emit('menu:action', 'resetProperties');
      }
    }, {
      type: 'separator'
    });

    if (this.options.state.development || this.options.state.devtools) {
      submenu.push({
        label: 'Reload',
        accelerator: 'CommandOrControl+R',
        click: function(menuItem, browserWindow) {
          browserWindow.reload();
        }
      });
    }

    submenu.push({
      label: 'Toggle DevTools',
      accelerator: 'F12',
      click: (menuItem, browserWindow) => {
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
      click: function(menuItem, browserWindow) {
        if (browserWindow.isFullScreen()) {
          return browserWindow.setFullScreen(false);
        }
        browserWindow.setFullScreen(true);
      }
    });

    if (app.mainWindow) {
      this.menu.append(new MenuItem({
        label: 'Window',
        submenu: Menu.buildFromTemplate(submenu)
      }));
    }

    return this;
  }

  appendPluginsMenu() {
    if (this.options.plugins.length === 0) {
      return this;
    }

    const submenu = this.options.plugins
      .map(p => {
        let label = p.name;

        if (p.error) {
          label = label.concat(' <error>');
        }

        const menuItemDescriptor = {
          label: label,
          enabled: false
        };

        if (p.menu) {
          try {
            const menuEntries = p.menu(app, this.options.state);
            menuItemDescriptor.enabled = true;
            menuItemDescriptor.submenu = Menu.buildFromTemplate(menuEntries.map(menuDescriptor => {
              return new MenuItem({
                label: menuDescriptor.label,
                accelerator: menuDescriptor.accelerator,
                enabled: menuDescriptor.enabled(),
                click: menuDescriptor.action,
                submenu: menuDescriptor.submenu
              });
            }));
          }
          catch (e) {
            console.error(e);
            menuItemDescriptor.label = menuItemDescriptor.label.concat(' <error>');
            menuItemDescriptor.enabled = false;
          }
        }

        return [new MenuItem(menuItemDescriptor)];
      })
      .reduce((previous, elem) => elem.concat(previous));

    this.menu.append(new MenuItem({
      label: 'Plugins',
      submenu: Menu.buildFromTemplate(submenu)
    }));

    return this;
  }

  appendHelpMenu(submenu) {
    this.menu.append(new MenuItem({
      label: 'Help',
      submenu: submenu || Menu.buildFromTemplate([
        {
          label: 'Documentation',
          click: function() {
            browserOpen('https://docs.camunda.org/manual/latest/modeler/camunda-modeler');
          }
        },
        {
          label: 'User Forum',
          click: function() {
            browserOpen('https://forum.camunda.org/c/modeler');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: function(menuItem, browserWindow) {
            app.emit('menu:action', 'show-shortcuts');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'BPMN 2.0 Tutorial',
          click: function() {
            browserOpen('https://camunda.org/bpmn/tutorial/');
          }
        },
        {
          label: 'BPMN Modeling Reference',
          click: function() {
            browserOpen('https://camunda.org/bpmn/reference/');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'DMN 1.1 Tutorial',
          click: function() {
            browserOpen('https://camunda.org/dmn/tutorial/');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'CMMN 1.1 Tutorial',
          click: function() {
            browserOpen('https://docs.camunda.org/get-started/cmmn11/');
          }
        },
        {
          label: 'CMMN Modeling Reference',
          click: function() {
            browserOpen('https://docs.camunda.org/manual/latest/reference/cmmn11/');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Version ' + app.version,
          enabled: false
        }
      ])
    }));

    return this;
  }

  appendSeparator() {
    this.menu.append(new MenuItem({
      type: 'separator'
    }));
    return this;
  }

  get() {
    return this.menu;
  }

  build() {
    return this.appendFileMenu(new this.constructor(this.options)
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
      .get())
      .appendEditMenu()
      .appendWindowMenu()
      .appendPluginsMenu()
      .appendHelpMenu()
      .setMenu();
  }

  setMenu() {
    Menu.setApplicationMenu(this.menu);
    return this;
  }

  appendContextCloseTab(attrs) {
    this.menu.append(new MenuItem({
      label: 'Close Tab',
      enabled: this.options.state.close,
      accelerator: 'CommandOrControl+W',
      click: function() {
        app.emit('menu:action', 'close-tab', attrs);
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close All Tabs',
      enabled: this.options.state.close,
      click: function() {
        app.emit('menu:action', 'close-all-tabs');
      }
    }));

    this.menu.append(new MenuItem({
      label: 'Close Other Tabs',
      enabled: this.options.state.close,
      click: function() {
        app.emit('menu:action', 'close-other-tabs', attrs);
      }
    }));

    return this;
  }

  buildContextMenu(type, attrs) {
    if (type === 'bpmn') {
      return this.appendCopyPaste();
    }
    if (type === 'tab') {
      return this.appendNewFile()
        .appendSeparator()
        .appendContextCloseTab(attrs)
        .appendSeparator()
        .appendReopenLastTab();
    }
  }

  openPopup() {
    return this.menu.popup({});
  }
}

module.exports = MenuBuilder;
