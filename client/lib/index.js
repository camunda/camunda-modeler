'use strict';

var domReady = require('domready');

var Delegator = require('dom-delegator');

// provide vdom utility
global.h = require('vdom/h');

var Logger = require('base/logger'),
    Events = require('base/events'),
    FileSystem = require('external/file-system'),
    Dialog = require('external/dialog');

var App = require('./app');

var EmptyTab = require('app/tabs/empty-tab');

var mainLoop = require('util/dom/main-loop');

// init dom-delegator
Delegator();


domReady(function() {

  var app = new App({
    logger: new Logger(),
    events: new Events(),
    dialog: new Dialog(),
    fileSystem: new FileSystem()
  });

  app.on('app:run', function() {

    var debuggerTab = new EmptyTab({
      id: 'debugger',
      label: 'DO DEBUG',
      title: 'Create new Diagram',
      render: function() {
        return <h1> DEBUG YEA </h1>;
      }
    });

    app.emit('tab:add', debuggerTab, { select: true });

    app.createDiagram('bpmn');
  });

  mainLoop(app, document.body);

  app.run();
});


require('debug').enable('*');