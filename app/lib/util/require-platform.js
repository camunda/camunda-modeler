/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

/**
 * Provides platform specific import.
 *
 * @param {string} platform
 *
 * @param {string} path
 */
module.exports = function get(platform, path, defaultExport) {

  function resolvePlatform(modulePath) {

    try {
      return require(modulePath);
    } catch (e) {
      if (e.message.startsWith('Cannot find module')) {
        return defaultExport;
      }

      throw e;
    }
  }

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
