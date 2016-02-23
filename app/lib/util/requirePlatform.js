'use strict';

/**
 * Provides platform specific import.
 *
 * @param {String} platform
 *
 * @param {String} path
 *
 * @return {Function} defaultImplementation
 */
module.exports = function get(platform, path, defaultImplementation) {
  // TODO: verify skip platform if path does not exist
  if (platform === 'win32') {
    return require(path + '/windows');
  } else if (platform === 'darwin') {
    return require(path + '/mac-os');
  } else if (platform == 'linux') {
    return require(path + '/linux');
  } else {
    return defaultImplementation;
  }
};