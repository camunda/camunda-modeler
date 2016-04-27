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
    appName: 'Camunda Modeler',
    state: {
      dmn: false,
      bpmn: false,
      undo: false,
      redo: false,
      editable: false,
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
    }])
  }));

  return this;
};

MenuBuilder.prototype.appendOpen = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Open File...',
    accelerator: 'CommandOrControl+O',
    click: function() {
      app.emit('menu:action', 'open-diagram');
    }
  }));


  this.menu.append(new MenuItem({
    label: 'Reopen Last File',
    accelerator: 'CommandOrControl+Shift+T',
    click: function() {
      app.emit('menu:action', 'reopen-last-tab');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveFile = function(submenu) {
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

MenuBuilder.prototype.appendSaveAsFile = function(submenu) {
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

MenuBuilder.prototype.appendSaveAllFiles = function(submenu) {
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

MenuBuilder.prototype.appendCopyPaste = function(includeRole) {

  var copyEntry = {
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    click: function() {
      app.emit('menu:action', 'copy');
    }
  };

  var pasteEntry = {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    click: function() {
      app.emit('menu:action', 'paste');
    }
  };

  if (includeRole) {
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

  this.menu.append(new MenuItem({
    label: 'Cut',
    accelerator: 'CommandOrControl+X',
    role: 'cut'
  }));

  this.appendCopyPaste(true);

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

  this.menu.append(new MenuItem({
    label: 'Remove Selected',
    accelerator: 'Delete',
    enabled: this.opts.state.elementsSelected,
    click: function() {
      app.emit('menu:action', 'removeSelection');
    }
  }));

  return this;
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
      label: 'Zoom Default',
      accelerator: 'CommandOrControl+0',
      click: function() {
        app.emit('menu:action', 'zoom');
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
    submenu: submenu || Menu.buildFromTemplate([{
      label: 'Give Feedback',
      click: function() {
        browserOpen('https://forum.camunda.org/c/modeler');
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
      label: 'Version ' + app.version,
      enabled: false
    }])
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

MenuBuilder.prototype.buildContextMenu = function() {
  return this.appendCopyPaste();
};

MenuBuilder.prototype.openPopup = function() {
  return this.menu.popup();
};
