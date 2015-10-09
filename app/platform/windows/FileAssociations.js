'use strict';

var execSync = require('child_process').execSync;

var REG_BASE_KEY = 'HKEY_CURRENT_USER\\Software\\Classes\\.bpmn',
    REG_ICON_KEY = REG_BASE_KEY+ '\\DefaultIcon',
    REG_COMMAND_KEY = REG_BASE_KEY + '\\shell\\open\\command';

var REG_KEY_NOT_FOUND_PATTERN = /The system was unable to find the specified registry key or value/;

var REG_COMMAND_RESULT_PATTERN = /.*REG_SZ\s+(.*) -- %1$/m;

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: [ 'pipe', 'pipe', 'pipe' ] });
}

function ignoreNotFound(fn) {
  try {
    return fn();
  } catch (err) {
    if (REG_KEY_NOT_FOUND_PATTERN.test(err.message)) {
      return null;
    } else {
      throw err;
    }
  }
}

module.exports.register = function(exePath) {
  exec('reg ADD ' + REG_COMMAND_KEY + ' /d "\"' + exePath + '\" -- \"%1\"" /f');
  exec('reg ADD ' + REG_ICON_KEY + ' /d "' + exePath + ',0" /f');

  return true;
};

module.exports.query = function() {
  return ignoreNotFound(function() {
    var result = exec('reg query ' + REG_COMMAND_KEY + ' /ve');

    var match = REG_COMMAND_RESULT_PATTERN.exec(result);

    if (match) {
      return match[1];
    } else {
      throw new Error('query: unparsable result:\n', result);
    }
  });
};

module.exports.deregister = function() {
  ignoreNotFound(function() {
    exec('reg DELETE ' + REG_BASE_KEY + ' /f');
  });
};