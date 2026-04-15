/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export function isInput(element) {
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.contentEditable === 'true'
  );
}

/**
 * Check if given element or any ancestor is a text input.
 *
 * @param {Element} element
 *
 * @returns {boolean}
 */
export function isTextInput(element) {
  return element.closest('input, textarea, [contenteditable="true"]') !== null;
}

export function active(element) {
  element = element || document.activeElement;

  if (!element) {
    element = document.getSelection().focusNode;
  }

  return isInput(element);
}