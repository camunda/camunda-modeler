'use strict';

function isUnsaved(file) {
  return file && file.path === '[unsaved]';
}

module.exports = isUnsaved;
