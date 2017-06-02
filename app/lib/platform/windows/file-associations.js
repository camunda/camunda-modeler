'use strict';

var execSync = require('child_process').execSync;

var forEach = require('lodash/collection/forEach'),
    unique = require('lodash/array/uniq');


var EXTENSIONS = [ 'bpmn', 'dmn', 'cmmn' ];

var REG_KEY_NOT_FOUND_PATTERN_EN = /The system was unable to find the specified registry key or value/;
var REG_KEY_NOT_FOUND_PATTERN_DE = /Wert wurde nicht gefunden/;

var REG_COMMAND_RESULT_PATTERN = /.*REG_SZ\s+"(.*)" -- "%1"$/m;

function exec(cmd) {
  var result = execSync(cmd, { encoding: 'utf-8', stdio: [ 'pipe', 'pipe', 'pipe' ] });

  console.log('[file associations] exec\n> %s\n%s', cmd, result);

  return result;
}

function createKey(extension) {
  var regBaseKey = 'HKEY_CURRENT_USER\\Software\\Classes\\.' + extension,
      regIconKey = regBaseKey + '\\DefaultIcon',
      regCommandKey = regBaseKey + '\\shell\\open\\command';

  return {
    base: regBaseKey,
    icon: regIconKey,
    command: regCommandKey
  };
}

function ignoreNotFound(fn) {
  try {
    return fn();
  } catch (err) {
    if (REG_KEY_NOT_FOUND_PATTERN_EN.test(err.message) ||
        REG_KEY_NOT_FOUND_PATTERN_DE.test(err.message)) {
      return null;
    } else {
      throw err;
    }
  }
}

module.exports.register = function(exePath) {
  forEach(EXTENSIONS, function(extension) {
    var regKey = createKey(extension);

    exec('reg ADD ' + regKey.command + ' /d "\\"' + exePath + '\\" -- \\"%1\\"" /f');
    exec('reg ADD ' + regKey.icon + ' /d "' + exePath + ',0" /f');
  });

  return true;
};

module.exports.query = function() {
  return ignoreNotFound(function() {
    var keys = [];

    forEach(EXTENSIONS, function(extension) {
      var regKey = createKey(extension);

      var result = exec('reg query ' + regKey.command + ' /ve');

      var match = REG_COMMAND_RESULT_PATTERN.exec(result);

      if (match) {
        keys.push(match[1]);
      } else {
        throw new Error('query: unparsable result:\n', result);
      }
    });

    return unique(keys);
  });
};

module.exports.deregister = function() {
  ignoreNotFound(function() {
    forEach(EXTENSIONS, function(extension) {
      var regKey = createKey(extension);

      exec('reg DELETE ' + regKey.base + ' /f');
    });
  });
};
