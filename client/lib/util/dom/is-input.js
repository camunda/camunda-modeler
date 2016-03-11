'use strict';

function isInput(element) {
  return element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
}

module.exports.isInput = isInput;

function active(element) {
  element = element || document.activeElement;

  return isInput(element);
}

module.exports.active = active;
