'use strict';

var electron = require('electron'),
    Menu = electron.Menu,
    MenuItem = electron.MenuItem,
    app = electron.app;

var browserOpen = require('../util/browser-open');

var merge = require('lodash/object/merge');


function MenuBuilder(opts) {
  this.opts = merge({
    appName: 'Camunda Modeler',
    state: {
      dmn: false,
      bpmn: false,
      undo: false,
      redo: false,
      editable: false,
      zoom: false,
      save: false,
      closable: false,
      elementsSelected: false,
      dmnRuleEditing: false,
      dmnClauseEditingfalse: false
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
      click: function () {
        app.emit('menu:action', 'create-bpmn-diagram');
      }
    }, {
      label: 'DMN Table',
      click: function () {
        app.emit('menu:action', 'create-dmn-diagram');
      }
    }])
  }));

  return this;
};

MenuBuilder.prototype.appendOpenFile = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Open File...',
    accelerator: 'CommandOrControl+O',
    click: function () {
      app.emit('menu:action', 'open-diagram');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendSaveFile = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Save File',
    enabled: this.opts.state.save,
    accelerator: 'CommandOrControl+S',
    click: function () {
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
    click: function () {
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
    click: function () {
      app.emit('menu:action', 'save-all');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendCloseTab = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Close Tab',
    enabled: this.opts.state.closable,
    accelerator: 'CommandOrControl+W',
    click: function () {
      app.emit('menu:action', 'close-active-tab');
    }
  }));

  return this;
};

MenuBuilder.prototype.appendQuit = function(submenu) {
  this.menu.append(new MenuItem({
    label: 'Quit',
    accelerator: 'CommandOrControl+Q',
    click: function () {
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
    click: function () {
      app.emit('menu:action', 'redo');
    }
  }));
};

MenuBuilder.prototype.appendBaseEditActions = function() {
  this.menu.append(new MenuItem({
    label: 'Undo',
    enabled: this.opts.state.undo,
    accelerator: 'CommandOrControl+Z',
    click: function () {
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

  this.menu.append(new MenuItem({
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    role: 'copy'
  }));

  this.menu.append(new MenuItem({
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    role: 'paste'
  }));

  return this;
};

MenuBuilder.prototype.appendBpmnActions = function() {
  this.menu.append(new MenuItem({
    label: 'Hand Tool',
    accelerator: 'H',
    enabled: this.opts.state.inactiveInput,
    click: function () {
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
    label: 'Direct Editing',
    accelerator: 'E',
    enabled: this.opts.state.elementsSelected,
    click: function() {
      app.emit('menu:action', 'directEditing');
    }
  }));

  this.menu.append(new MenuItem({
    type: 'separator'
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

MenuBuilder.prototype.appendDmnActions = function () {
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
      click: function () {
        app.emit('menu:action', 'zoomIn');
      }
    }, {
      label: 'Zoom Out',
      accelerator: 'CommandOrControl+-',
      click: function () {
        app.emit('menu:action', 'zoomOut');
      }
    }, {
      label: 'Zoom Default',
      accelerator: 'CommandOrControl+0',
      click: function () {
        app.emit('menu:action', 'zoom');
      }
    }, {
      type: 'separator'
    });
  }

  submenu.push({
    label: 'Reload',
    accelerator: 'CommandOrControl+R',
    click: function(menuItem, browserWindow) {
      browserWindow.reload();
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
  }, {
    label: 'Toggle DevTools',
    accelerator: 'F12',
    click: function(menuItem, browserWindow) {
      browserWindow.toggleDevTools();
    }
  });


  if (app.mainWindow){
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
    }, {
      type: 'separator'
    }, {
      label: 'BPMN 2.0 Tutorial',
      click: function() {
        browserOpen('https://camunda.org/bpmn/tutorial/');
      }
    }, {
      label: 'BPMN Modeling Reference',
      click: function() {
        browserOpen('https://camunda.org/bpmn/reference/');
      }
    }, {
      type: 'separator'
    }, {
      label: 'DMN 1.1 Tutorial',
      click: function() {
        browserOpen('https://camunda.org/dmn/tutorial/');
      }
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
      .appendOpenFile()
      .appendSeparator()
      .appendSaveFile()
      .appendSaveAsFile()
      .appendSaveAllFiles()
      .appendSeparator()
      .appendCloseTab()
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
