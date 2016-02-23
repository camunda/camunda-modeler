'use strict';

var Menu = require('menu');
var MenuItem = require('menu-item');
var app = require('electron').app;
var browserOpen = require('../util/browser-open');
var merge = require('lodash/object/merge');

var MenuBuilder = module.exports = function MenuBuilder(opts) {
  this.opts = merge({
    appName: 'Camunda Modeler',
    canvasMoveSpeed: 20,
    menuState: {}
  }, opts);
  if (this.opts.template) {
    this.menu = Menu.buildFromTemplate(this.opts.template);
  } else {
    this.menu = new Menu();
  }
};

MenuBuilder.prototype.appendAppMenu = function () {
  return this;
};

MenuBuilder.prototype.appendFileMenu = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'file',
    label: 'File',
    submenu: submenu
  }));
  return this;
};

MenuBuilder.prototype.appendNewFile = function () {
  this.menu.append(new MenuItem({
    id: 'newFile',
    label: 'New File',
    submenu: Menu.buildFromTemplate([{
      id: 'newBpmnFile',
      label: 'BPMN Diagram',
      accelerator: 'CommandOrControl+T',
      click: function (menuItem, win) {
        win.webContents.send('file:create:bpmn');
      }
    }, {
      id: 'newDmnFile',
      label: 'DMN Table',
      click: function (menuItem, win) {
        win.webContents.send('file:create:dmn');
      }
    }])
  }));
  return this;
};

MenuBuilder.prototype.appendOpenFile = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'openFile',
    label: 'Open File...',
    accelerator: 'CommandOrControl+O',
    click: function (menuItem, win) {
      win.webContents.send('file:open');
    }
  }));
  return this;
};

MenuBuilder.prototype.appendSaveFile = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'save',
    label: 'Save File',
    accelerator: 'CommandOrControl+S',
    click: function (menuItem, win) {
      win.webContents.send('file:save');
    }
  }));
  return this;
};

MenuBuilder.prototype.appendSaveAsFile = function (submenu) {
  this.menu.append(new MenuItem({
    label: 'Save File As..',
    accelerator: 'CommandOrControl+Shift+S',
    click: function (menuItem, win) {
      win.webContents.send('file:save-as');
    }
  }));
  return this;
};

MenuBuilder.prototype.appendCloseTab = function (submenu) {
  this.menu.append(new MenuItem({
    label: 'Close Tab',
    accelerator: 'CommandOrControl+W',
    click: function (menuItem, win) {
      win.webContents.send('file:close');
    }
  }));
  return this;
};

MenuBuilder.prototype.appendQuit = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'quit',
    label: 'Quit',
    accelerator: 'CommandOrControl+Q',
    click: function (menuItem, win) {
      // TODO: delegate to the client quit event
      app.quit();
    }
  }));
  return this;
};

MenuBuilder.prototype.appendRedo = function () {
  this.menu.append(new MenuItem({
    id: 'redo',
    label: 'Redo',
    accelerator: 'CommandOrControl+Y',
    click: function (menuItem, win) {
      win.webContents.send('editor:redo');
    }
  }));
};

MenuBuilder.prototype.appendBaseEditActions = function () {
  this.menu.append(new MenuItem({
    id: 'undo',
    label: 'Undo',
    accelerator: 'CommandOrControl+Z',
    click: function (menuItem, win) {
      win.webContents.send('editor:undo');
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
  this.appendSeparator();
  return this;
};

MenuBuilder.prototype.appendBpmnActions = function () {
  var self = this;
  this.menu.append(new MenuItem({
    label: 'Hand Tool',
    accelerator: 'H',
    click: function (menuItem, win) {
      win.webContents.send('editor:hand-tool');
    }
  }));
  this.menu.append(new MenuItem({
    label: 'Lasso Tool',
    accelerator: 'L',
    click: function (menuItem, win) {
      win.webContents.send('editor:lasso-tool');
    }
  }));
  this.menu.append(new MenuItem({
    label: 'Space Tool',
    accelerator: 'S',
    click: function (menuItem, win) {
      win.webContents.send('editor:space-tool');
    }
  }));
  this.menu.append(new MenuItem({
    id: 'bpmn:directEditing',
    label: 'Direct Editing',
    accelerator: 'E',
    click: function (menuItem, win) {
      win.webContents.send('editor:direct-edit');
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
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'bpmn.moveCanvas',
          data: {
            speed: self.opts.canvasMoveSpeed,
            direction: 'up'
          }
        });
      }
    }, {
      label: 'Move Left',
      accelerator: 'Left',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'bpmn.moveCanvas',
          data: {
            speed: self.opts.canvasMoveSpeed,
            direction: 'left'
          }
        });
      }
    }, {
      label: 'Move Down',
      accelerator: 'Down',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'bpmn.moveCanvas',
          data: {
            speed: self.opts.canvasMoveSpeed,
            direction: 'down'
          }
        });
      }
    }, {
      label: 'Move Right',
      accelerator: 'Right',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'bpmn.moveCanvas',
          data: {
            speed: self.opts.canvasMoveSpeed,
            direction: 'right'
          }
        });
      }
    }])
  }));
  this.menu.append(new MenuItem({
    label: 'Select All',
    accelerator: 'CommandOrControl+A',
    role: 'selectall',
    click: function (menuItem, win) {
      win.webContents.send('editor.actions', {
        event: 'bpmn.selectElements'
      });
    }
  }));
  this.menu.append(new MenuItem({
    id: 'bpmn:removeSelected',
    label: 'Remove Selected',
    accelerator: 'Delete',
    click: function (menuItem, win) {
      win.webContents.send('editor.actions', {
        event: 'bpmn.removeSelection'
      });
    }
  }));
  return this;
};

MenuBuilder.prototype.appendDmnActions = function () {
  this.menu.append(new MenuItem({
    id: 'dmn:addRules',
    label: 'Add Rule..',
    submenu: Menu.buildFromTemplate([{
      id: 'dmn:ruleAdd',
      label: 'At End',
      accelerator: 'CommandOrControl+D',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.ruleAdd'
        });
      }
    }, {
      id: 'dmn:ruleAddAbove',
      label: 'Above Selected',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.ruleAddAbove'
        });
      }
    }, {
      id: 'dmn:ruleAddBelow',
      label: 'Below Selected',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.ruleAddBelow'
        });
      }
    }])
  }));
  this.menu.append(new MenuItem({
    id: 'dmn:ruleClear',
    label: 'Clear Rule',
    click: function (menuItem, win) {
      win.webContents.send('editor.actions', {
        event: 'dmn.ruleClear'
      });
    }
  }));
  this.menu.append(new MenuItem({
    id: 'dmn:ruleRemove',
    label: 'Remove Rule',
    click: function (menuItem, win) {
      win.webContents.send('editor.actions', {
        event: 'dmn.ruleRemove'
      });
    }
  }));
  this.appendSeparator();
  this.menu.append(new MenuItem({
    id: 'dmn:addClauses',
    label: 'Add Clause..',
    submenu: Menu.buildFromTemplate([{
      label: 'Input',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.clauseAdd',
          data: {
            type: 'input'
          }
        });
      }
    }, {
      label: 'Output',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.clauseAdd',
          data: {
            type: 'output'
          }
        });
      }
    }, {
      type: 'separator'
    }, {
      id: 'dmn:clauseAddLeft',
      label: 'Left of selected',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.clauseAddLeft'
        });
      }
    }, {
      id: 'dmn:clauseAddRight',
      label: 'Right of selected',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'dmn.clauseAddRight'
        });
      }
    }])
  }));
  this.menu.append(new MenuItem({
    id: 'dmn:clauseRemove',
    label: 'Remove Clause',
    click: function (menuItem, win) {
      win.webContents.send('editor.actions', {
        event: 'dmn.clauseRemove'
      });
    }
  }));
  return this;
};

MenuBuilder.prototype.appendEditMenu = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'edit',
    label: 'Edit',
    submenu: submenu
  }));
  return this;
};

MenuBuilder.prototype.appendWindowMenu = function (submenu) {
  this.menu.append(new MenuItem({
    id: 'window',
    label: 'Window',
    submenu: submenu || Menu.buildFromTemplate([{
      id: 'zoomIn',
      label: 'Zoom In',
      accelerator: 'CommandOrControl+=',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'editor.stepZoom',
          data: {
            value: 1
          }
        });
      }
    }, {
      id: 'zoomIn',
      label: 'Zoom Out',
      accelerator: 'CommandOrControl+-',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'editor.stepZoom',
          data: {
            value: -1
          }
        });
      }
    }, {
      id: 'zoomDefault',
      label: 'Zoom Default',
      accelerator: 'CommandOrControl+0',
      click: function (menuItem, win) {
        win.webContents.send('editor.actions', {
          event: 'editor.zoom',
          data: {
            value: 1
          }
        });
      }
    }, {
      type: 'separator'
    }, {
      id: 'reload',
      label: 'Reload',
      accelerator: 'CommandOrControl+R',
      click: function (menuItem, win) {
        win.reload();
      }
    }, {
      id: 'fullscreen',
      label: 'Fullscreen',
      accelerator: 'F11',
      click: function (menuItem, win) {
        if (win.isFullScreen()) {
          return win.setFullScreen(false);
        }

        win.setFullScreen(true);
      }
    }, {
      id: 'devTools',
      label: 'Toggle DevTools',
      accelerator: 'F12',
      click: function (menuItem, win) {
        win.toggleDevTools();
      }
    }])
  }));
  return this;
};

MenuBuilder.prototype.appendHelpMenu = function (submenu) {
  this.menu.append(new MenuItem({
    label: 'Help',
    submenu: submenu || Menu.buildFromTemplate([{
      label: 'Forum (bpmn.io)',
      click: function (menuItem, win) {
        browserOpen('https://forum.bpmn.io/');
      }
    }, {
      type: 'separator'
    }, {
      label: 'BPMN 2.0 Tutorial',
      click: function (menuItem, win) {
        browserOpen('https://camunda.org/bpmn/tutorial/');
      }
    }, {
      label: 'BPMN Modeling Reference',
      click: function (menuItem, win) {
        browserOpen('https://camunda.org/bpmn/reference/');
      }
    }, {
      type: 'separator'
    }, {
      label: 'DMN 1.1 Tutorial',
      click: function (menuItem, win) {
        browserOpen('https://camunda.org/dmn/tutorial/');
      }
    }])
  }));
  return this;
};

MenuBuilder.prototype.appendSeparator = function () {
  this.menu.append(new MenuItem({
    type: 'separator'
  }));
  return this;
};

MenuBuilder.prototype.get = function () {
  return this.menu;
};

MenuBuilder.prototype.build = function () {
  return this.appendFileMenu(
      new MenuBuilder()
      .appendNewFile()
      .appendOpenFile()
      .appendSeparator()
      .appendSaveFile()
      .appendSaveAsFile()
      .appendSeparator()
      .appendCloseTab()
      .appendQuit()
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
    .appendHelpMenu()
    .setMenu();
};

MenuBuilder.prototype.setMenu = function () {
  Menu.setApplicationMenu(this.menu);
  return this;
};