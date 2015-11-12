'use strict';

var app = require('app');

/**
 * Get initializer for the selected platform.
 *
 * @param {String} platform
 *
 * @return {Function}
 */
function get(platform) {
  try {
    if (platform === 'win32') {
      return require('./windows');
    } else
    if (platform === 'darwin') {
      return require('./mac-os');
    } else
    if (platform == 'linux') {
      return require('./linux');
    }
  } catch (e) {
    // no integration; bad luck
    console.log(e);
  }

  return null;
}

module.exports.get = get;


/**
 * Initialize app on the given platform.
 *
 * @param {String} platform
 * @param {ElectronApp} app
 * @param {Config} config

 * @return {ElectronApp}
 */
function init(platform, config) {
  var initialize = get(platform);

  if (initialize) {
    initialize(app, config);
  }

  return app;
}

module.exports.init = init;
