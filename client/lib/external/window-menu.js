'use strict';

var browser = require('util/browser');
var debug = require('debug')('window-menu');


/**
 * Application Window Menu integration
 */
function WindowMenu(app) {

  // Notifying menu about client state change
  app.on('state:changed', function (state) {
    debug('---> state:changed: ', state);
    browser.send('menu:update', state);
  });

  // Menu actions
  browser.on('file:create:bpmn', function(err, args) {
    debug('file:create:bpmn');

    app.triggerAction('create-bpmn-diagram');
  });

  browser.on('file:create:dmn', function(err, args) {
    debug('file:create:dmn');

    app.triggerAction('create-dmn-diagram');
  });

  browser.on('file:open', function(err, args) {
    debug('file:open');

    app.triggerAction('open-diagram');
  });

  browser.on('file:save', function(err, args) {
    debug('file:save');

    app.triggerAction('save');
  });

  browser.on('file:save-as', function(err, args) {
    debug('file:save-as');

    app.triggerAction('save-as');
  });

  browser.on('file:close', function(err, args) {
    debug('file:close');

    app.triggerAction('close-active-tab');
  });

  browser.on('editor:undo', function(err, args) {
    debug('file:undo');

    app.triggerAction('undo');
  });

  browser.on('editor:redo', function(err, args) {
    debug('file:redo');

    app.triggerAction('redo');
  });

  browser.on('editor:hand-tool', function(err, args) {
    debug('editor:hand-tool');
    // TODO: implement in the client
    // app.triggerAction('hand-tool');
  });
  browser.on('editor:lasso-tool', function(err, args) {
    debug('editor:lasso-tool');
    // TODO: implement in the client
    // app.triggerAction('lasso-tool');
  });
  browser.on('editor:space-tool', function(err, args) {
    debug('editor:space-tool');
    // TODO: implement in the client
    // app.triggerAction('space-tool');
  });
  browser.on('editor:direct-edit', function(err, args) {
    debug('editor:direct-edit');
    // TODO: implement in the client
    // app.triggerAction('direct-edit');
  });

}

module.exports = WindowMenu;
