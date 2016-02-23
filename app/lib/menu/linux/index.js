'use strict';

var inherits = require('inherits');
var MenuBuilder = require('../MenuBuilder');

var LinuxMenuBuilder = module.exports = function LinuxMenuBuilder(options) {
  MenuBuilder.call(this, options);
};

inherits(LinuxMenuBuilder, MenuBuilder);