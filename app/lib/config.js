'use strict';

var fs = require('fs');


function Config(configPath) {
  this._configPath = configPath;
  this._data = {};
}

module.exports = Config;


/**
 * Loads the current configuration, defaulting to reseting
 * if loading fails.
 *
 * @throws {Error} if reading the file or deserializing fails.
 */
Config.prototype.loadSync = function() {

  var stringifiedData;

  try {
    stringifiedData = fs.readFileSync(this._configPath, { encoding: 'utf8' });

    this._data = JSON.parse(stringifiedData);
  } catch (err) {
    this._data = {};

    // ignore non-existing file error
    if (err.code === 'ENOENT') {
      return;
    }

    console.error('config: failed to load', err);
  }
};

/**
 * Saves the current configuration.
 *
 * @throws {Error} if serializing to JSON or writing the file failed
 */
Config.prototype.saveSync = function() {
  fs.writeFileSync(this._configPath, JSON.stringify(this._data), { encoding: 'utf8' });
};

Config.prototype.save = function(callback) {
  fs.writeFile(this._configPath, JSON.stringify(this._data), { encoding: 'utf8' }, callback);
};


Config.prototype.get = function(key, defaultValue) {
  var result = this._data[key];

  if (result !== undefined) {
    return result;
  } else {
    return defaultValue;
  }
};


Config.prototype.set = function(key, value, callback) {
  this._data[key] = value;

  if (callback && typeof callback === 'function') {
    return this.save(callback);
  }

  try {
    this.saveSync();
  } catch (err) {
    console.error('config: failed to write', err);
    // oops, could not write :-/
  }
};


/**
 * Load an existing configuration from the given path.
 *
 * @param {String} configPath
 *
 * @return {Config}
 */
function load(configPath) {

  var config = new Config(configPath);

  config.loadSync();

  return config;
}

module.exports.load = load;
