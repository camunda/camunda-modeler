'use strict';

var MenuBuilder = require('../MenuBuilder');

var WindowsMenuBuilder = module.exports = function WindowsMenuBuilder(options) {
  MenuBuilder.call(this, options);
};

WindowsMenuBuilder.prototype = Object.create(MenuBuilder.prototype);