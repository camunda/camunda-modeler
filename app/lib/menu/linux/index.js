'use strict';

var inherits = require('inherits');

var MenuBuilder = require('../menu-builder');


function LinuxMenuBuilder(options) {
  MenuBuilder.call(this, options);
}

inherits(LinuxMenuBuilder, MenuBuilder);

module.exports = LinuxMenuBuilder;
