/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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
      id: 'copy',
      label: 'Copy',
      binding: keyboardBinding('C', modifierKey)
    },
    {
      id: 'copyAsImage',
      label: 'Copy as image',
      binding: keyboardBinding('Shift + C', modifierKey)
    },
    {
      id: 'cut',
      label: 'Cut',
      binding: keyboardBinding('X', modifierKey)
    },
    {
      id: 'paste',
      label: 'Paste',
      binding: keyboardBinding('V', modifierKey)
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      binding: keyboardBinding('D', modifierKey)
    },
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
