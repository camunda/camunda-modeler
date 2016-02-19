'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var debug = require('debug')('Triggers');


module.exports = function Triggers(clientApi){
  ipcRenderer.on('file:create:bpmn', function(event, err, args) {
    debug('file:create:bpmn');
    clientApi.triggerAction('create-bpmn-diagram');
  });

  ipcRenderer.on('file:create:dmn', function(event, err, args) {
    debug('file:create:dmn');
    clientApi.triggerAction('create-dmn-diagram');
  });

  ipcRenderer.on('file:open', function(event, err, args) {
    debug('file:open');
    clientApi.triggerAction('open-diagram');
  });

  ipcRenderer.on('file:save', function(event, err, args) {
    debug('file:save');
    clientApi.triggerAction('save');
  });

  ipcRenderer.on('file:save-as', function(event, err, args) {
    debug('file:save-as');
    clientApi.triggerAction('save-as');
  });

  ipcRenderer.on('file:close', function(event, err, args) {
    debug('file:close');
    clientApi.triggerAction('close-active-tab');
  });

};