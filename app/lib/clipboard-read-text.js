const { clipboard } = require('electron');

module.exports = function clipboardReadText() {
  return clipboard.readText();
}; 