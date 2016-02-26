'use strict';

var browser = require('util/browser');
var debug = require('debug')('window-menu');


/**
 * Application Window Menu integration
 */
function WindowMenu(app) {

  // Updating Menu
  app.on('state:changed', function (state) {
    debug('Notifying menu about client state change', state);
    browser.send('menu:update', state);
  });

  // Menu actions
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
  listenOnMenuAction('editor:removeSelection', 'removeSelection');
  listenOnMenuCanvasAction('editor:moveCanvas:up', 'up');
  listenOnMenuCanvasAction('editor:moveCanvas:down', 'down');
  listenOnMenuCanvasAction('editor:moveCanvas:left', 'left');
  listenOnMenuCanvasAction('editor:moveCanvas:right', 'right');
  listenOnMenuAction('dmn.ruleAdd', 'ruleAdd');
  listenOnMenuAction('dmn.ruleAddAbove', 'ruleAddAbove');
  listenOnMenuAction('dmn.ruleAddBelow', 'ruleAddBelow');
  listenOnMenuAction('dmn.ruleRemove', 'ruleRemove');
  listenOnMenuAction('dmn.ruleClear', 'ruleClear');
  listenOnMenuClauseAddAction('dmn.clauseAdd.input', 'input');
  listenOnMenuClauseAddAction('dmn.clauseAdd.output', 'output');
  listenOnMenuAction('dmn.clauseAddLeft', 'clauseAddLeft');
  listenOnMenuAction('dmn.clauseAddRight', 'clauseAddRight');
  listenOnMenuAction('dmn.clauseRemove', 'clauseRemove');
  listenOnMenuZoomAction('editor:stepZoom:in', 'stepZoom', 1);
  listenOnMenuZoomAction('editor:stepZoom:out', 'stepZoom', -1);
  listenOnMenuZoomAction('editor:zoom', 'zoom', 1);


  function listenOnMenuZoomAction(actionEvent, targetEvent, value) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction(targetEvent, {
        value: value
      });
    });
  }

  function listenOnMenuAction(actionEvent, targetEvent) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction(targetEvent, args);
    });
  }

  function listenOnMenuClauseAddAction(actionEvent, type) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction('clauseAdd', type);
    });
  }

  function listenOnMenuCanvasAction(actionEvent, direction) {
    browser.on(actionEvent, function(err, args) {
      debug('Received action from menu: ' + actionEvent);

      app.triggerAction('moveCanvas', {
        speed: 20,
        direction: direction
      });
    });
  }

}

module.exports = WindowMenu;
