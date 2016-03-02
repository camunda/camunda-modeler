'use strict';

var browser = require('util/browser');
var debug = require('debug')('window-menu');


/**
 * Application Window Menu integration
 */
function WindowMenu(app) {

  // Updating Menu
  app.on('tools:state-changed', function (tab, state) {
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
