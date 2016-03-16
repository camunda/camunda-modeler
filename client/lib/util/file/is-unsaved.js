'use strict';

var defaultPath = '[unsaved]';

function isUnsaved(file) {
  return !file || file.path === defaultPath;
}

isUnsaved.PATH = defaultPath;

module.exports = isUnsaved;
