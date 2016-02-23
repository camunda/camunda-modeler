'use strict';

var merge = require('lodash/object/merge');

var debug = require('debug')('state');

/**
 * A component that keeps track of the client applications
 * externally visible state.
 *
 * This is used by external components, i.e. to integrate
 * and update the menu.
 *
 * @param {App} app
 */
function State(app) {

  this.cache = {};

  app.on('state:update', (partialUpdate) => {
    debug('state:update', partialUpdate);

    var newState = this.cache = merge({ }, this.cache, partialUpdate);

    app.emit('state:changed', newState);
  });

}

module.exports = State;