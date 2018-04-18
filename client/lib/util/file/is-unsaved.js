'use strict';

function isUnsaved(file) {
  return !file || !!file.isUnsaved;
}

module.exports = isUnsaved;
