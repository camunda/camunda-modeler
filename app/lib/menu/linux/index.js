'use strict';

var MenuBuilder = require('../MenuBuilder');

var LinuxMenuBuilder = module.exports = function LinuxMenuBuilder(options) {
  MenuBuilder.call(this, options);
};

LinuxMenuBuilder.prototype = Object.create(MenuBuilder.prototype);