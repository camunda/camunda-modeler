const { shell } = require('electron');

module.exports = function(url) {
  return shell.openExternal(url);
};
