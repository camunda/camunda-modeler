'use strict';

var electron = require('electron'),
    Menu = electron.Menu,
    MenuItem = electron.MenuItem,
    app = electron.app;

var browserOpen = require('../util/browser-open');

var merge = require('lodash/object/merge'),
    assign = require('lodash/object/assign');


function MenuBuilder(opts) {
  this.opts = merge({
    appName: app.name,
    state: {
      dmn: false,
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
      closable: false,
      elementsSelected: false,
      dmnRuleEditing: false,
      dmnClauseEditingfalse: false,
      exportAs: false,
      development: app.developmentMode,
      devtools: false
    }
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
        app.emit('menu:action', 'create-dmn-diagram');
      }
    },{
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

MenuBuilder.prototype.appendExportAs = function(submenu) {
  var exportState = this.opts.state.exportAs;

  function canExport(type) {
    return (exportState || []).indexOf(type) !== -1;
  }

  this.menu.append(new MenuItem({
    label: 'Export As..',
    submenu: submenu || Menu.buildFromTemplate([{
      label: 'PNG Image',
      enabled: canExport('png'),
      click: function() {
        app.emit('menu:action', 'export-tab', { type: 'png' });
      }
    },
    {
      label: 'JPEG Image',
      enabled: canExport('jpeg'),
      click: function() {
        app.emit('menu:action', 'export-tab', { type: 'jpeg' });
      }
    },
    {
      label: 'SVG Image',
      enabled: canExport('svg'),
      click: function() {
        app.emit('menu:action', 'export-tab', { type: 'svg' });
      }
    }])
  }));

  this.appendSeparator();

  return this;
};

MenuBuilder.prototype.appendCloseTab = function() {
  this.menu.append(new MenuItem({
    label: 'Close Tab',
    enabled: this.opts.state.closable,
    accelerator: 'CommandOrControl+W',
    click: function() {
      app.emit('menu:action', 'close-active-tab');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close All Tabs',
    enabled: this.opts.state.closable,
    click: function() {
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close Other Tabs',
    enabled: this.opts.state.closable,
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
      enabled: this.opts.state.closable,
      accelerator: 'Control+TAB',
      click: function() {
        app.emit('menu:action', 'select-tab', 'next');
      }
    },
    {
      label: 'Select Previous Tab',
      enabled: this.opts.state.closable,
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

MenuBuilder.prototype.appendRedo = function() {
  this.menu.append(new MenuItem({
    label: 'Redo',
    enabled: this.opts.state.redo,
    accelerator: 'CommandOrControl+Y',
    click: function() {
      app.emit('menu:action', 'redo');
    }
  }));
};

MenuBuilder.prototype.appendCopyPaste = function() {

  var copyEntry = {
    label: 'Copy',
    enabled: !this.opts.state.inactiveInput || (this.opts.state.elementsSelected && this.opts.state.copy),
    accelerator: 'CommandOrControl+C',
    click: function() {
      app.emit('menu:action', 'copy');
    }
  };

  var pasteEntry = {
    label: 'Paste',
    enabled: !this.opts.state.inactiveInput || this.opts.state.paste,
    accelerator: 'CommandOrControl+V',
    click: function() {
      app.emit('menu:action', 'paste');
    }
  };

  if (!this.opts.state.inactiveInput) {
    this.menu.append(new MenuItem({
      label: 'Cut',
      accelerator: 'CommandOrControl+X',
      role: 'cut'
    }));

    copyEntry.role = 'copy';
    pasteEntry.role = 'paste';
  }

  this.menu.append(new MenuItem(copyEntry));

  this.menu.append(new MenuItem(pasteEntry));

  return this;
};

MenuBuilder.prototype.appendBaseEditActions = function() {
  this.menu.append(new MenuItem({
    label: 'Undo',
    enabled: this.opts.state.undo,
    accelerator: 'CommandOrControl+Z',
    click: function() {
      app.emit('menu:action', 'undo');
    }
  }));

  this.appendRedo();

  this.appendSeparator();

  this.appendCopyPaste();

  return this;
};

MenuBuilder.prototype.appendBpmnActions = function() {
  this.menu.append(new MenuItem({
    label: 'Hand Tool',
    accelerator: 'H',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'handTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Lasso Tool',
    accelerator: 'L',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'lassoTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Space Tool',
    accelerator: 'S',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'spaceTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Global Connect Tool',
    accelerator: 'C',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'globalConnectTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Direct Editing',
    accelerator: 'E',
    enabled: this.opts.state.elementsSelected,
    click: function() {
      app.emit('menu:action', 'directEditing');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Align Elements',
    enabled: this.opts.state.elementsSelected,
    submenu: Menu.buildFromTemplate([
      {
        label: 'Align Left',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'left'
          });
        }
      }, {
        label: 'Align Right',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'right'
          });
        }
      }, {
        label: 'Align Center',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'center'
          });
        }
      }, {
        label: 'Align Top',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'top'
          });
        }
      }, {
        label: 'Align Bottom',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'bottom'
          });
        }
      }, {
        label: 'Align Middle',
        click: function() {
          app.emit('menu:action', 'alignElements', {
            type: 'middle'
          });
        }
      }
    ])
  }));

  this.menu.append(new MenuItem({
    label: 'Distribute Elements',
    enabled: this.opts.state.elementsSelected,
    submenu: Menu.buildFromTemplate([
      {
        label: 'Distribute Horizontally',
        enabled: this.opts.state.elementsSelected,
        click: function() {
          app.emit('menu:action', 'distributeHorizontally');
        }
      },
      {
        label: 'Distribute Vertically',
        enabled: this.opts.state.elementsSelected,
        click: function() {
          app.emit('menu:action', 'distributeVertically');
        }
      }
    ])
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Find',
    accelerator: 'CommandOrControl + F',
    click: function() {
      app.emit('menu:action', 'find');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Move Elements to Origin',
    accelerator: 'CommandOrControl+Shift+0',
    click: function() {
      app.emit('menu:action', 'moveToOrigin');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Move Canvas',
    submenu: Menu.buildFromTemplate([{
      label: 'Move Up',
      accelerator: 'Up',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'up'
        });
      }
    }, {
      label: 'Move Left',
      accelerator: 'Left',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'left'
        });
      }
    }, {
      label: 'Move Down',
      accelerator: 'Down',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'down'
        });
      }
    }, {
      label: 'Move Right',
      accelerator: 'Right',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'right'
        });
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: 'Select All',
    accelerator: 'CommandOrControl+A',
    click: function() {
      app.emit('menu:action', 'selectElements');
    }
  }));

  this.appendRemoveSelection();

  return this;
};


MenuBuilder.prototype.appendCmmnActions = function() {
  this.menu.append(new MenuItem({
    label: 'Hand Tool',
    accelerator: 'H',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'handTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Lasso Tool',
    accelerator: 'L',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'lassoTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Space Tool',
    accelerator: 'S',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'spaceTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Global Connect Tool',
    accelerator: 'C',
    enabled: this.opts.state.inactiveInput,
    click: function() {
      app.emit('menu:action', 'globalConnectTool');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Edit Label',
    accelerator: 'E',
    enabled: this.opts.state.elementsSelected,
    click: function() {
      app.emit('menu:action', 'directEditing');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Find',
    accelerator: 'CommandOrControl + F',
    click: function() {
      app.emit('menu:action', 'find');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Move Canvas',
    submenu: Menu.buildFromTemplate([{
      label: 'Move Up',
      accelerator: 'Up',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'up'
        });
      }
    }, {
      label: 'Move Left',
      accelerator: 'Left',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'left'
        });
      }
    }, {
      label: 'Move Down',
      accelerator: 'Down',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'down'
        });
      }
    }, {
      label: 'Move Right',
      accelerator: 'Right',
      click: function() {
        app.emit('menu:action', 'moveCanvas', {
          direction: 'right'
        });
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: 'Select All',
    accelerator: 'CommandOrControl+A',
    click: function() {
      app.emit('menu:action', 'selectElements');
    }
  }));

  this.appendRemoveSelection();

  return this;
};

MenuBuilder.prototype.appendRemoveSelection = function() {
  this.menu.append(new MenuItem({
    label: 'Remove Selected',
    accelerator: 'Delete',
    enabled: this.opts.state.elementsSelected,
    click: function() {
      app.emit('menu:action', 'removeSelection');
    }
  }));
};


MenuBuilder.prototype.appendDmnActions = function() {
  this.menu.append(new MenuItem({
    label: 'Add Rule..',
    submenu: Menu.buildFromTemplate([{
      label: 'At End',
      accelerator: 'CommandOrControl+D',
      click: function() {
        app.emit('menu:action', 'ruleAdd');
      }
    }, {
      label: 'Above Selected',
      enabled: this.opts.state.dmnRuleEditing,
      click: function() {
        app.emit('menu:action', 'ruleAddAbove');
      }
    }, {
      label: 'Below Selected',
      enabled: this.opts.state.dmnRuleEditing,
      click: function() {
        app.emit('menu:action', 'ruleAddBelow');
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: 'Clear Rule',
    enabled: this.opts.state.dmnRuleEditing,
    click: function() {
      app.emit('menu:action', 'ruleClear');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Remove Rule',
    enabled: this.opts.state.dmnRuleEditing,
    click: function() {
      app.emit('menu:action', 'ruleRemove');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Add Clause..',
    submenu: Menu.buildFromTemplate([{
      label: 'Input',
      click: function() {
        app.emit('menu:action', 'clauseAdd', {
          type: 'input'
        });
      }
    }, {
      label: 'Output',
      click: function() {
        app.emit('menu:action', 'clauseAdd', {
          type: 'output'
        });
      }
    }, {
      type: 'separator'
    }, {
      label: 'Left of selected',
      enabled: this.opts.state.dmnClauseEditing,
      click: function() {
        app.emit('menu:action', 'clauseAddLeft');
      }
    }, {
      label: 'Right of selected',
      enabled: this.opts.state.dmnClauseEditing,
      click: function() {
        app.emit('menu:action', 'clauseAddRight');
      }
    }])
  }));

  this.menu.append(new MenuItem({
    label: 'Remove Clause',
    enabled: this.opts.state.dmnClauseEditing,
    click: function() {
      app.emit('menu:action', 'clauseRemove');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Insert New Line',
    accelerator: 'CommandOrControl + Enter',
    enabled: this.opts.state.dmnRuleEditing,
    click: function() {
      app.emit('menu:action', 'insertNewLine');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Select Next Row',
    accelerator: 'Enter',
    enabled: this.opts.state.dmnRuleEditing,
    click: function() {
      app.emit('menu:action', 'selectNextRow');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Select Previous Row',
    accelerator: 'Shift + Enter',
    enabled: this.opts.state.dmnRuleEditing,
    click: function() {
      app.emit('menu:action', 'selectPreviousRow');
    }
  }));

  this.appendSeparator();

  this.menu.append(new MenuItem({
    label: 'Toggle Editing Mode',
    accelerator: 'CommandOrControl + M',
    click: function() {
      app.emit('menu:action', 'toggleEditingMode');
    }
  }));

  return this;
};


MenuBuilder.prototype.appendSearchActions = function() {
  this.menu.append(new MenuItem({
    label: 'Find',
    accelerator: 'CommandOrControl + F',
    click: function() {
      app.emit('menu:action', 'find');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Find Next',
    accelerator: 'Shift + CommandOrControl + N',
    click: function() {
      app.emit('menu:action', 'findNext');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Find Previous',
    accelerator: 'Shift + CommandOrControl + P',
    click: function() {
      app.emit('menu:action', 'findPrev');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Replace',
    accelerator: 'Shift + CommandOrControl + F',
    click: function() {
      app.emit('menu:action', 'replace');
    }
  }));
};

MenuBuilder.prototype.appendEditMenu = function() {
  if (this.opts.state.editable) {
    var builder = new this.constructor(this.opts).appendBaseEditActions();

    if (this.opts.state.bpmn) {
      builder.appendSeparator();

      builder.appendBpmnActions();
    }

    if (this.opts.state.dmn) {
      builder.appendSeparator();

      builder.appendDmnActions();
    }

    if (this.opts.state.cmmn) {
      builder.appendSeparator();

      builder.appendCmmnActions();
    }

    if (this.opts.state.searchable) {
      builder.appendSeparator();

      builder.appendSearchActions();
    }

    this.menu.append(new MenuItem({
      label: 'Edit',
      submenu: builder.get()
    }));
  }

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
    enabled: this.opts.state.closable,
    accelerator: 'CommandOrControl+W',
    click: function() {
      app.emit('menu:action', 'close-tab', attrs);
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close All Tabs',
    enabled: this.opts.state.closable,
    click: function() {
      app.emit('menu:action', 'close-all-tabs');
    }
  }));

  this.menu.append(new MenuItem({
    label: 'Close Other Tabs',
    enabled: this.opts.state.closable,
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
  return this.menu.popup();
};
