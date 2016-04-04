'use strict';

function getParent(element, className, depth) {

  var targetClassName;

  while (element && element !== document.body && depth) {
    targetClassName = element.className;

    if (targetClassName) {
      // unwrap actual className for SVGElements
      targetClassName = targetClassName.baseVal || targetClassName;

      if (targetClassName.split(/\s/g).indexOf(className) !== -1) {
        return element;
      }
    }

    depth--;
    element = element.parentNode;
  }

  return null;
}

module.exports = getParent;
