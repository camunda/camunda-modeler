'use strict';

var browser = require('util/browser');

var debug = require('debug')('context-menu');


/**
 * Application Window Menu integration
 */
function ContextMenu(app) {

  // Updating Menu
  app.on('context-menu:open', function(type, attrs) {
    debug('[context-menu] open');

    browser.send('context-menu:open', type, attrs);
  });
}

module.exports = ContextMenu;
