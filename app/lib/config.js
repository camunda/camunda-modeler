const fs = require('fs');
const path = require('path');

const log = require('debug')('app:config');
const logError = require('debug')('app:config:error');

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

  log('loading from %s', path);

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

    logError('failed to load', err);
  }
};

/**
 * Saves the current configuration.
 *
 * @throws {Error} if serializing to JSON or writing the file failed
 */
Config.prototype.saveSync = function() {
  fs.writeFileSync(this._configPath, JSON.stringify(this._data), { encoding: 'utf8' });

  log('saved');
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

  log('set %s', key);

  try {
    this.saveSync();
  } catch (err) {
    logError('failed to write', err);
  }
};

