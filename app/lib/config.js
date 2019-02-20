/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

const log = require('./log')('app:config');

function Config(options) {
  this._configPath = path.join(options.path, 'config.json');

  this.loadSync();
}

module.exports = Config;


/**
 * Loads the current configuration, defaulting to reseting
 * if loading fails.
 *
 * @throws {Error} if reading the file or deserializing fails.
 */
Config.prototype.loadSync = function() {

  const path = this._configPath;

  log.info('loading from %s', path);

  var stringifiedData;

  try {
    stringifiedData = fs.readFileSync(path, { encoding: 'utf8' });

    this._data = JSON.parse(stringifiedData);
  } catch (err) {
    this._data = {};

    // ignore non-existing file error
    if (err.code === 'ENOENT') {
      return;
    }

    log.error('failed to load', err);
  }
};

/**
 * Saves the current configuration.
 *
 * @throws {Error} if serializing to JSON or writing the file failed
 */
Config.prototype.saveSync = function() {
  fs.writeFileSync(this._configPath, JSON.stringify(this._data), { encoding: 'utf8' });

  log.info('saved');
};


Config.prototype.get = function(key, defaultValue) {
  var result = this._data[key];

  if (result !== undefined) {
    return result;
  } else {
    return defaultValue;
  }
};


Config.prototype.set = function(key, value) {
  this._data[key] = value;

  log.info('set %s', key);

  try {
    this.saveSync();
  } catch (err) {
    log.error('failed to write', err);
  }
};

