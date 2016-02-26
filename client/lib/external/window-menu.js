'use strict';

var browser = require('util/browser');
var debug = require('debug')('window-menu');


/**
 * Application Window Menu integration
 */
function WindowMenu(app) {

  // Notifying menu about client state change
  app.on('state:changed', function (state) {
    debug('Notifying menu about client state change', state);
    browser.send('menu:update', state);
  });

  // Menu actions
  function listenOnMenuAction(actionEvent, targetEvent) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction(targetEvent, args);
    });
  }

  listenOnMenuAction('file:create:bpmn', 'create-bpmn-diagram');
  listenOnMenuAction('file:create:dmn', 'create-dmn-diagram');
  listenOnMenuAction('file:open', 'open-diagram');
  listenOnMenuAction('file:save', 'save');
  listenOnMenuAction('file:save-as', 'save-as');
  listenOnMenuAction('file:close', 'close-active-tab');
  listenOnMenuAction('editor:undo', 'undo');
  listenOnMenuAction('editor:redo', 'redo');
  listenOnMenuAction('editor:handTool', 'handTool');
  listenOnMenuAction('editor:lassoTool', 'lassoTool');
  listenOnMenuAction('editor:spaceTool', 'spaceTool');
  listenOnMenuAction('editor:directEditing', 'directEditing');
  listenOnMenuAction('editor:selectElements', 'selectElements');
  listenOnMenuAction('editor:removeSelection', 'removeSelection');


  function listenOnMenuCanvasAction(actionEvent, direction) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction('moveCanvas', {
        speed: 20,
        direction: direction
      });
    });
  }

  listenOnMenuCanvasAction('editor:moveCanvas:up', 'up');
  listenOnMenuCanvasAction('editor:moveCanvas:down', 'down');
  listenOnMenuCanvasAction('editor:moveCanvas:left', 'left');
  listenOnMenuCanvasAction('editor:moveCanvas:right', 'right');

}

module.exports = WindowMenu;
