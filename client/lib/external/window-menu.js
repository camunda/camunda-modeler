'use strict';

var browser = require('util/browser'),
    isMac = require('util/is-mac');

var ShortcutsFix = require('./shortcuts-fix');

var debug = require('debug')('window-menu');


/**
 * Application Window Menu integration
 */
function WindowMenu(app) {

  this.fix = new ShortcutsFix(app, isMac());

  this.fix.bind();

  // Updating Menu
  app.on('tools:state-changed', (tab, state) => {
    debug('Notifying menu about client state change', state);

    browser.send('menu:update', state);
  });


  // Listening on menu actions
  browser.on('menu:action', function(err, action, options) {
    debug('Received action from menu: ' + action, options);

    app.triggerAction(action, options);
  });

}

module.exports = WindowMenu;
