var shell = require('shell');

module.exports = function(url) {
  return shell.openExternal(url);
};