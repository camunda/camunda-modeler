'use strict';

function replaceFileExt(str, type) {
  return str.replace(/.\w+$/, '.' + type);
}

module.exports = replaceFileExt;
