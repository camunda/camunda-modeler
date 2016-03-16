'use strict';

var domReady = require('domready');

var Delegator = require('dom-delegator');

var debug = require('debug')('app-client');

// provide vdom utility
global.h = require('vdom/h');

var Logger = require('base/logger'),
    Events = require('base/events'),
    Workspace = require('external/workspace'),
    FileSystem = require('external/file-system'),
    Dialog = require('external/dialog'),
    Menu = require('external/window-menu');

var App = require('./app');

var mainLoop = require('util/dom/main-loop');

var browser = require('util/browser');


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

  app.on('ready', function() {
    debug('client is ready');

    browser.send('client:ready');
  });

  app.on('quitting', function() {
    debug('client is quitting');

    browser.send('app:quit-allowed');
  });

  browser.on('client:open-files', function(e, files) {
    debug('opening external files: ', files);

    app.openFiles(files);
  });

  mainLoop(app, document.body);

  app.run();
});


require('debug').enable('*');
