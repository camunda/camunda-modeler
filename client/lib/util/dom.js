'use strict';

function isInput(element) {
  return element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
}

module.exports.isInput = isInput;