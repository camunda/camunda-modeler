'use strict';

var inherits = require('inherits');

var MenuBuilder = require('../menu-builder');


function WindowsMenuBuilder(options) {
  MenuBuilder.call(this, options);
}

inherits(WindowsMenuBuilder, MenuBuilder);

module.exports = WindowsMenuBuilder;
