/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getCopyCutPasteEntries, getDefaultCopyCutPasteEntries } from '../getEditMenu';


export default function getBpmnContextMenu(state) {

  console.log('GET MENU', state);

  const {
    inputActive,
    selectAll,
    removeSelected,
    elementsSelected,
    defaultCopyCutPaste
  } = state;

  const menuEntries = [];

  menuEntries.push(
    (defaultCopyCutPaste
      ? getDefaultCopyCutPasteEntries(true)
      : getCopyCutPasteEntries(state)).filter(e => e.enabled)
  );

  menuEntries.push([
    {
      label: 'Select all',
      accelerator: 'CommandOrControl + A',
      enabled: selectAll,
      action: 'selectElements',
      role: inputActive && 'selectAll'
    }
  ]);

  if (removeSelected) {
    menuEntries.push([
      {
        label: 'Delete',
        accelerator: 'Delete',
        enabled: true,
        action: 'removeSelection',
        role: inputActive && 'delete'
      }
    ]);
  }

  if (!inputActive && !elementsSelected) {
    menuEntries.push([
      {
        label: 'Toggle grid',
        accelerator: 'CommandOrControl+G',
        action: 'toggleGrid',
        enabled: true
      }, {
        label: 'Toggle properties panel',
        accelerator: 'CommandOrControl+P',
        action: 'toggleProperties',
        enabled: true
      }
    ]);
  }

  console.log('get context menu', {
    state,
    menuEntries
  });

  return menuEntries;
}
