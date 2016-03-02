'use strict';

var renderer = require('../util/renderer');

var requirePlatform = require('../util/requirePlatform');


function Menu(platform) {
  var MenuBuilder = requirePlatform(platform, __dirname);

  // Replacing Electron default menu until application loads
  new MenuBuilder().build();

  renderer.on('menu:update', function(state) {
    new MenuBuilder({ state: state }).build();
  });
}

module.exports = Menu;
