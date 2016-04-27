'use strict';

var browser = require('util/browser');

var debug = require('debug')('context-menu');


/**
 * Application Window Menu integration
 */
function ContextMenu(app) {

  // Updating Menu
  app.on('context-menu:open', function() {
    debug('[context-menu] open');

    browser.send('context-menu:open');
  });
}

module.exports = ContextMenu;
