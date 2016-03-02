'use strict';

var domReady = require('domready');

var Delegator = require('dom-delegator');

// provide vdom utility
global.h = require('vdom/h');

var Logger = require('base/logger'),
    Events = require('base/events'),
    Workspace = require('external/workspace'),
    FileSystem = require('external/file-system'),
    Dialog = require('external/dialog'),
    Menu = require('external/window-menu');

var App = require('./app');

var mainLoop = require('util/dom/main-loop'),
    isMac = require('util/is-mac');

var ShortcutsFix = require('app/shortcuts-fix');


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
  new Menu(app);

  if (isMac()) {
    new ShortcutsFix(app).bind();
  }

  mainLoop(app, document.body);

  app.run();
});


require('debug').enable('*');
