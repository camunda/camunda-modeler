'use strict';

module.exports.extname = extname;

function extname(filePath) {
  var pattern,
      match;

  filePath = filePath || '';

  pattern = /(bpmn20|dmn11)*\.(\w+)$/;
  match = filePath.match(pattern);

  if (!match) {
    return false;
  }

  return match[0].replace(/^\./, '');
}

function notation(filePath) {
  var extension = extname(filePath);

  if (extension) {
    return false;
  }

  return extension.match(/^[A-z]+/)[0];
}

module.exports.notation = notation;
