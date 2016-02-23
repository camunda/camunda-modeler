'use strict';

var inherits = require('inherits');
var MenuBuilder = require('../MenuBuilder');

var WindowsMenuBuilder = module.exports = function WindowsMenuBuilder(options) {
  MenuBuilder.call(this, options);
};

inherits(WindowsMenuBuilder, MenuBuilder);