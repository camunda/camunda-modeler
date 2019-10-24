/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const focusableElementsSelector = [
  'a[href]',
  'button:not([disabled])',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '*[tabindex]',
  '*[contenteditable]'
].join();

export default function FocusTrap(getElement) {

  let tabbing = false;

  function restoreFocus(target) {

    const first = getFirstFocusableElement(),
          last = getLastFocusableElement();

    // do nothing if there is no focusable element
    if (!first) {
      return;
    }

    if (target !== first) {
      first.focus();
    } else {
      last.focus();
    }
  }

  function handleBlur(event) {

    // do nothing if focus stays inside the modal
    if (getElement().contains(event.relatedTarget)) {
      return;
    }

    if (!tabbing) {
      return;
    }

    restoreFocus(event.target);
  }

  function handleKeyDown(event) {
    if (isTab(event)) {
      tabbing = true;
    }
  }

  function handleKeyUp(event) {
    tabbing = false;
  }

  function getFirstFocusableElement() {
    return getFocusableElements()[0];
  }

  function getLastFocusableElement() {
    const elements = getFocusableElements();

    return elements[ elements.length - 1 ];
  }

  function getFocusableElements() {
    return getElement().querySelectorAll(focusableElementsSelector);
  }

  function focus() {

    // focus the first focusable element if currently
    // focussed element is outside the modal
    if (getElement().contains(document.activeElement)) {
      return;
    }

    const focusable = getFirstFocusableElement();

    focusable && focusable.focus();
  }

  function mount() {
    focus();

    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  function unmount() {
    document.removeEventListener('blur', handleBlur, true);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }

  return {
    mount,
    unmount
  };

}


// helpers ///////////////

function isTab(event) {
  return event.key === 'Tab';
}
