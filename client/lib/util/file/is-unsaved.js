'use strict';

function isUnsaved(file) {
  return file.path === '[unsaved]';
}

module.exports = isUnsaved;