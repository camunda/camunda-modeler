'use strict';

var shell = require('electron').shell;

module.exports = function(url) {
  return shell.openExternal(url);
};
