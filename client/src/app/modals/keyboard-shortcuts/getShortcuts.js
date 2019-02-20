/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const keyboardBinding = (binding, modifierKey) => {
  if (modifierKey) {
    binding = `${modifierKey} + ${binding}`;
  }

  return binding;
};

export default function(modifierKey) {

  return [
    {
      id: 'addLineFeed',
      label: 'Add Line Feed (in text box)',
      binding: keyboardBinding('Shift + Enter')
    },
    {
      id: 'scrollVertical',
      label: 'Scrolling (Vertical)',
      binding: keyboardBinding('Mouse Wheel')
    },
    {
      id: 'scrollHorizontal',
      label: 'Scrolling (Horizontal)',
      binding: keyboardBinding('Shift + Mouse Wheel')
    },
    {
      id: 'addElementToSelection',
      label: 'Add element to selection',
      binding: keyboardBinding('Mouse Click', modifierKey)
    },
    {
      id: 'selectMultipleElements',
      label: 'Select multiple elements (Lasso Tool)',
      binding: keyboardBinding('Shift + Mouse Drag')
    }
  ];

}