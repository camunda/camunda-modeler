'use strict';

var electron = require('electron'),
    Menu = electron.Menu,
    MenuItem = electron.MenuItem,
    app = electron.app;

var browserOpen = require('../util/browser-open');

var {
  merge,
  assign
} = require('min-dash');


function MenuBuilder(opts) {
  this.opts = merge({
    appName: app.name,
    state: {
      dmn: false,
      activeEditor: null,
      cmmn: false,
      bpmn: false,
      undo: false,
      redo: false,
      editable: false,
      copy: false,
      paste: false,
      searchable: false,
      zoom: false,
      save: false,
      close: false,
      elementsSelected: false,
      dmnRuleEditing: false,
      dmnClauseEditing: false,
      exportAs: false,
      development: app.developmentMode,
      devtools: false
    },
    plugins: []
  }, opts);

  if (this.opts.template) {
    this.menu = Menu.buildFromTemplate(this.opts.template);
  } else {
    this.menu = new Menu();
  }
}

module.exports = MenuBuilder;

MenuBuilder.prototype.appendAppMenu = function() {
  return this;
};

MenuBuilder.prototype.appendFileMenu = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'File',
    submenu: submenu
  }));

  return this;
};

MenuBuilder.prototype.appendNewFile = function() {
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
};

MenuBuilder.prototype.appendOpen = function() {
  this.menu.append(new MenuItem({
    label: 'Open File...',
    accelerator: 'CommandOrControl+O',
    click: function() {
      app.emit('menu:action', 'open-diagram');
    }
  }));

  this.appendReopenLastTab();

  return this;
};

MenuBuilder.prototype.appendReopenLastTab = function() {
  this.menu.append(new MenuItem({
    label: 'Reopen Last File',
    accelerator: 'CommandOrControl+Shift+T',
    click: function() {
      app.emit('menu:action', 'reopen-last-tab');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveFile = function() {
  this.menu.append(new MenuItem({
    label: 'Save File',
    enabled: this.opts.state.save,
    accelerator: 'CommandOrControl+S',
    click: function() {
      app.emit('menu:action', 'save');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveAsFile = function() {
  this.menu.append(new MenuItem({
    label: 'Save File As..',
    accelerator: 'CommandOrControl+Shift+S',
    enabled: this.opts.state.save,
    click: function() {
      app.emit('menu:action', 'save-as');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveAllFiles = function() {
  this.menu.append(new MenuItem({
    label: 'Save All Files',
    accelerator: 'CommandOrControl+Alt+S',
    enabled: this.opts.state.save,
    click: function() {
      app.emit('menu:action', 'save-all');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendExportAs = function() {
  var exportState = this.opts.state.exportAs;

  var enabled = exportState && exportState.length > 0;

  this.menu.append(new MenuItem({
    label: 'Export As Image',
    enabled: enabled,
    click: function() {
      app.emit('menu:action', 'export-tab', exportState || []);
    }
  }));

  this.appendSeparator();

  return this;
};

MenuBuilder.prototype.appendCloseTab = function() {
  this.menu.append(new MenuItem({
    label: 'Close Tab',
    enabled: this.opts.state.close,
    accelerator: 'CommandOrControl+W',
    click: function() {
      app.emit('menu:action', 'close-active-tab');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close All Tabs',
    enabled: this.opts.state.close,
    click: function() {
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close Other Tabs',
    enabled: this.opts.state.close,
    click: function() {
      app.emit('menu:action', 'close-other-tabs');
    }
  }));

  return this;
};

// todo(ricardo): add a proper state check for switching tabs
MenuBuilder.prototype.appendSwitchTab = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Switch Tab..',
    submenu: submenu || Menu.buildFromTemplate([{
      label: 'Select Next Tab',
      enabled: this.opts.state.close,
      accelerator: 'Control+TAB',
      click: function() {
        app.emit('menu:action', 'select-tab', 'next');
      }
    },
    {
      label: 'Select Previous Tab',
      enabled: this.opts.state.close,
      accelerator: 'Control+SHIFT+TAB',
      click: function() {
        app.emit('menu:action', 'select-tab', 'previous');
      }
    }])
  }));

  this.appendSeparator();

  return this;
};

MenuBuilder.prototype.appendQuit = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Quit',
    accelerator: 'CommandOrControl+Q',
    click: function() {
      app.emit('app:quit');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendMenuItem = function(builder, menuItem) {
  var submenu;

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
};

MenuBuilder.prototype.getEditMenu = function(menuItems) {
  var builder = new this.constructor(this.opts);

  menuItems.forEach((menuItem, index) => {

    if (Array.isArray(menuItem)) {
      if (index !== 0) {
        builder.appendSeparator();
      }

      menuItem.forEach((menuItem) => {
        this.appendMenuItem(builder, menuItem);
      });
    } else {
      this.appendMenuItem(builder, menuItem);
    }

  });

  return builder.get();
};

MenuBuilder.prototype.appendEditMenu = function() {
  var subMenu;

  if (this.opts.state.editMenu) {
    subMenu = this.getEditMenu(this.opts.state.editMenu, this.opts);
  }

  this.menu.append(new MenuItem({
    label: 'Edit',
    submenu: subMenu
  }));

  return this;
};

MenuBuilder.prototype.appendWindowMenu = function() {

  var submenu = [];

  if (this.opts.state.zoom) {
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

  if (this.opts.state.development || this.opts.state.devtools) {
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

      var isDevToolsOpened = browserWindow.isDevToolsOpened();

      if (isDevToolsOpened) {

        app.mainWindow.once('devtools-closed', () => {
          app.emit('menu:update', assign({}, this.opts.state, {
            devtools: false
          }));
        });

        browserWindow.closeDevTools();
      } else {

        app.mainWindow.once('devtools-opened', () => {
          app.emit('menu:update', assign({}, this.opts.state, {
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
};

MenuBuilder.prototype.appendPluginsMenu = function() {
  if (this.opts.plugins.length === 0) {
    return this;
  }

  var submenu = this.opts.plugins
    .map(p => {

      var label = p.name;

      if (p.error) {
        label = label.concat(' <error>');
      }

      var menuItemDescriptor = {
        label: label,
        enabled: false
      };

      if (p.menu) {

        try {
          var menuEntries = p.menu(app, this.opts.state);

          menuItemDescriptor.enabled = true;
          menuItemDescriptor.submenu = Menu.buildFromTemplate(
            menuEntries.map(menuDescriptor => {
              return new MenuItem({
                label: menuDescriptor.label,
                accelerator: menuDescriptor.accelerator,
                enabled: menuDescriptor.enabled(),
                click: menuDescriptor.action,
                submenu: menuDescriptor.submenu
              });
            })
          );
        } catch (e) {
          console.error(e);
          menuItemDescriptor.label = menuItemDescriptor.label.concat(' <error>');
          menuItemDescriptor.enabled = false;
        }
      }

      return [ new MenuItem(menuItemDescriptor) ];
    })
    .reduce((previous, elem) => elem.concat(previous));

  this.menu.append(new MenuItem({
    label: 'Plugins',
    submenu: Menu.buildFromTemplate(submenu)
  }));

  return this;
};

MenuBuilder.prototype.appendHelpMenu = function(submenu) {
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
};

MenuBuilder.prototype.appendSeparator = function() {
  this.menu.append(new MenuItem({
    type: 'separator'
  }));

  return this;
};

MenuBuilder.prototype.get = function() {
  return this.menu;
};

MenuBuilder.prototype.build = function() {
  return this.appendFileMenu(
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
      .appendQuit()
      .get()
  )
    .appendEditMenu()
    .appendWindowMenu()
    .appendPluginsMenu()
    .appendHelpMenu()
    .setMenu();
};

MenuBuilder.prototype.setMenu = function() {
  Menu.setApplicationMenu(this.menu);

  return this;
};

MenuBuilder.prototype.appendContextCloseTab = function(attrs) {
  this.menu.append(new MenuItem({
    label: 'Close Tab',
    enabled: this.opts.state.close,
    accelerator: 'CommandOrControl+W',
    click: function() {
      app.emit('menu:action', 'close-tab', attrs);
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close All Tabs',
    enabled: this.opts.state.close,
    click: function() {
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close Other Tabs',
    enabled: this.opts.state.close,
    click: function() {
      app.emit('menu:action', 'close-other-tabs', attrs);
    }
  }));

  return this;
};

MenuBuilder.prototype.buildContextMenu = function(type, attrs) {
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
};

MenuBuilder.prototype.openPopup = function() {
  return this.menu.popup({});
};
