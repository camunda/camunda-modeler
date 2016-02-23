'use strict';

var requirePlatform = require('../util/requirePlatform');

module.exports.create = function create(platform, app, config) {
  var Platform = requirePlatform(platform, __dirname);

  return new Platform(app, config);
};
