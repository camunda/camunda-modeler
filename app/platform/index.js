'use strict';

/**
 * Get initializer for the selected platform.
 *
 * An initializer is a function that accepts (app, config) as an argument.
 *
 * @param {String} platform
 *
 * @return {Function}
 */
function get(platform) {
  if (platform === 'win32') {
    return require('./windows');
  } else
  if (platform === 'darwin') {
    return require('./mac-os');
  } else
  if (platform == 'linux') {
    return require('./linux');
  } else {
    // not platform init, bad luck :-(
    return function() { };
  }
}

module.exports.get = get;


function create(platform, app, config) {
  var Platform = get(platform);

  return new Platform(app, config);
}

module.exports.create = create;