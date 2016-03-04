'use strict';

/**
 * Provides platform specific import.
 *
 * @param {String} platform
 *
 * @param {String} path
 */
module.exports = function get(platform, path, defaultExport) {

  function resolvePlatform(modulePath) {
    if (require.resolve(modulePath)) {
      return require(modulePath);
    } else {
      return defaultExport;
    }
  }

  // TODO: verify skip platform if path does not exist
  if (platform === 'win32') {
    return resolvePlatform(path + '/windows');
  }

  else if (platform === 'darwin') {
    return resolvePlatform(path + '/mac-os');
  }

  else if (platform == 'linux') {
    return resolvePlatform(path + '/linux');
  }
  
  else {
    // not platform init, bad luck :-(
    throw new Error('your platform < ' + platform + ' > is not supported.');
  }
};
