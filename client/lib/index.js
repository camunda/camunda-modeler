'use strict';

var domReady = require('domready');

var Delegator = require('dom-delegator');

// provide vdom utility
global.h = require('vdom/h');

var Logger = require('base/logger'),
    Events = require('base/events'),
    State = require('app/state'),
    Workspace = require('external/workspace'),
    FileSystem = require('external/file-system'),
    Dialog = require('external/dialog'),
    Menu = require('external/window-menu');

var App = require('./app');

var mainLoop = require('util/dom/main-loop');

// init dom-delegator
Delegator();

domReady(function() {

  var app = new App({
    logger: new Logger(),
    events: new Events(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    workspace: new Workspace()
  });

  // Setting up external components
  new State(app);
  new Menu(app);

  // REVIEW: Workaround for menu keyboard bindings on Mac.
  // Can be removed, once migrated on to Electron >= 0.36.x
  function isMac() {
    return window.navigator.platform === 'MacIntel';
  }
  if (isMac) {
    var Shortcuts = require('app/shortcuts');
    new Shortcuts(app, window).bind();
  }


  mainLoop(app, document.body);

  app.run();
});


require('debug').enable('*');
