'use strict';

var app = require('app'),
    open = require('open');

var CANVAS_MOVE_SPEED = 20;


module.exports = function(browserWindow) {
  return [
    {
      id: 'file',
      label: 'File',
      submenu: [
        {
          id: 'newFile',
          label: 'New File',
          accelerator: 'CommandOrControl+T',
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.new' });
          }
        },
        {
          id: 'openFile',
          label: 'Open File..',
          accelerator: 'CommandOrControl+O',
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'file.open' });
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'save',
          label: 'Save File',
          accelerator: 'CommandOrControl+S',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', {
              event: 'file.save',
              data: {
                create: false
              }
            });
          }
        },
        {
          label: 'Save File As..',
          accelerator: 'CommandOrControl+Shift+S',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', {
              event: 'file.save',
              data: {
                create: true
              }
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Close Tab',
          enabled: false,
          accelerator: 'CommandOrControl+W',
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.close' });
          }
        },
        {
          id: 'quit',
          label: 'Quit',
          accelerator: 'CommandOrControl+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      submenu: [
        // Add modeling actions
        {
          label: 'Space Tool',
          accelerator: 'S',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.spaceTool' });
          }
        },
        {
          label: 'Lasso Tool',
          accelerator: 'L',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.lassoTool' });
          }
        },
        {
          id: 'directEditing',
          label: 'Direct Editing',
          enabled: false,
          accelerator: 'E',
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.directEditing' });
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Move Canvas',
          enabled: false,
          submenu: [
            {
              label: 'Move Up',
              accelerator: 'Up',
              click: function() {
                browserWindow.webContents.send('editor.actions', {
                  event: 'editor.moveCanvas',
                  data: {
                    speed: CANVAS_MOVE_SPEED,
                    direction: 'up'
                  }
                });
              }
            },
            {
              label: 'Move Left',
              accelerator: 'Left',
              click: function() {
                browserWindow.webContents.send('editor.actions', {
                  event: 'editor.moveCanvas',
                  data: {
                    speed: CANVAS_MOVE_SPEED,
                    direction: 'left'
                  }
                });
              }
            },
            {
              label: 'Move Down',
              accelerator: 'Down',
              click: function() {
                browserWindow.webContents.send('editor.actions', {
                  event: 'editor.moveCanvas',
                  data: {
                    speed: CANVAS_MOVE_SPEED,
                    direction: 'down'
                  }
                });
              }
            },
            {
              label: 'Move Right',
              accelerator: 'Right',
              click: function() {
                browserWindow.webContents.send('editor.actions', {
                  event: 'editor.moveCanvas',
                  data: {
                    speed: CANVAS_MOVE_SPEED,
                    direction: 'right'
                  }
                });
              }
            }
          ]
        },
        {
          label: 'Select All',
          enabled: false,
          accelerator: 'CommandOrControl+A',
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.selectElements' });
          }
        },
        {
          id: 'removeSelected',
          label: 'Remove Selected',
          accelerator: 'Delete',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.removeSelection' });
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'undo',
          label: 'Undo',
          accelerator: 'CommandOrControl+Z',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.undo' });
          }
        },
        {
          id: 'redo',
          label: 'Redo',
          accelerator: 'CommandOrControl+Shift+Z',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', { event: 'editor.redo' });
          }
        }
      ]
    },
    {
      id: 'window',
      label: 'Window',
      submenu: [
        {
          id: 'zoomIn',
          label: 'Zoom In',
          accelerator: 'CommandOrControl+=',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', {
              event: 'editor.stepZoom',
              data: {
                value: 1
              }
            });
          }
        },
        {
          id: 'zoomIn',
          label: 'Zoom Out',
          accelerator: 'CommandOrControl+-',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', {
              event: 'editor.stepZoom',
              data: {
                value: -1
              }
            });
          }
        },
        {
          id: 'zoomDefault',
          label: 'Zoom Default',
          accelerator: 'CommandOrControl+0',
          enabled: false,
          click: function() {
            browserWindow.webContents.send('editor.actions', {
              event: 'editor.zoom',
              data: {
                value: 1
              }
            });
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'reload',
          label: 'Reload',
          accelerator: 'CommandOrControl+R',
          click: function() {
            browserWindow.reload();
          }
        },
        {
          id: 'fullscreen',
          label: 'Fullscreen',
          accelerator: 'F11',
          click: function() {
            if (browserWindow.isFullScreen()) {
              return browserWindow.setFullScreen(false);
            }

            browserWindow.setFullScreen(true);
          }
        },
        {
          id: 'devTools',
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: function() {
            browserWindow.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'BPMN Modeling Reference',
          click: function() {
            open('https://camunda.org/bpmn/reference/');
          }
        },
        {
          label: 'BPMN 2.0 Tutorial',
          click: function() {
            open('https://camunda.org/bpmn/tutorial/');
          }
        },
        {
          label: 'BPMN 2.0 Best Practices',
          click: function() {
            open('https://camunda.org/bpmn/examples/');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Forum (bpmn.io)',
          click: function() {
            open('https://forum.bpmn.io/');
          }
        }
      ]
    }
  ];
};
