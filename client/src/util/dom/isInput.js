/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function isInput(element) {
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.contentEditable === 'true'
  );
}

export function active(element) {
  element = element || document.activeElement;

  if (!element) {
    element = document.getSelection().focusNode;
  }

  return isInput(element);
}