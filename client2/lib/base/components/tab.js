'use strict';

var inherits = require('inherits');

var BaseComponent = require('../component');


function Tab(options) {
  BaseComponent.call(this, options);
}

inherits(Tab, BaseComponent);

module.exports = Tab;


/**
 * Trigger action on the tab.
 *
 * @param {String} action
 * @param {Object} options
 */
Tab.prototype.triggerAction = function() {};
