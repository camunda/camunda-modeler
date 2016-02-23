'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var debug = require('debug')('Triggers');


module.exports = function Triggers(clientApi) {
  // Menu actions
  ipcRenderer.on('file:create:bpmn', function (event, err, args) {
    debug('file:create:bpmn');
    clientApi.triggerAction('create-bpmn-diagram');
  });

  ipcRenderer.on('file:create:dmn', function (event, err, args) {
    debug('file:create:dmn');
    clientApi.triggerAction('create-dmn-diagram');
  });

  ipcRenderer.on('file:open', function (event, err, args) {
    debug('file:open');
    clientApi.triggerAction('open-diagram');
  });

  ipcRenderer.on('file:save', function (event, err, args) {
    debug('file:save');
    clientApi.triggerAction('save');
  });

  ipcRenderer.on('file:save-as', function (event, err, args) {
    debug('file:save-as');
    clientApi.triggerAction('save-as');
  });

  ipcRenderer.on('file:close', function (event, err, args) {
    debug('file:close');
    clientApi.triggerAction('close-active-tab');
  });

  ipcRenderer.on('editor:undo', function (event, err, args) {
    debug('file:undo');
    clientApi.triggerAction('undo');
  });

  ipcRenderer.on('editor:redo', function (event, err, args) {
    debug('file:redo');
    clientApi.triggerAction('redo');
  });

  ipcRenderer.on('editor:hand-tool', function (event, err, args) {
    debug('editor:hand-tool');
    // TODO: implement in the client
    // clientApi.triggerAction('hand-tool');
  });
  ipcRenderer.on('editor:lasso-tool', function (event, err, args) {
    debug('editor:lasso-tool');
    // TODO: implement in the client
    // clientApi.triggerAction('lasso-tool');
  });
  ipcRenderer.on('editor:space-tool', function (event, err, args) {
    debug('editor:space-tool');
    // TODO: implement in the client
    // clientApi.triggerAction('space-tool');
  });
  ipcRenderer.on('editor:direct-edit', function (event, err, args) {
    debug('editor:direct-edit');
    // TODO: implement in the client
    // clientApi.triggerAction('direct-edit');
  });
};