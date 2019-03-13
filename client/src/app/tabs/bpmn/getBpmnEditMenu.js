/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  getCanvasEntries,
  getCopyCutPasteEntries,
  getDefaultCopyCutPasteEntries,
  getDefaultUndoRedoEntries,
  getDiagramFindEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../getEditMenu';

function getAlignDistributeEntries({
  align,
  distribute
}) {
  return [{
    label: 'Align Elements',
    enabled: align,
    submenu: [ 'Left', 'Right', 'Center', 'Top', 'Bottom', 'Middle' ].map(direction => {
      return {
        label: `Align ${direction}`,
        enabled: align,
        action: 'alignElements',
        options: {
          type: direction.toLowerCase()
        }
      };
    })
  }, {
    label: 'Distribute Elements',
    enabled: distribute,
    submenu: [{
      label: 'Distribute Horizontally',
      enabled: distribute,
      action: 'distributeElements',
      options: {
        type: 'horizontal'
      }
    }, {
      label: 'Distribute Vertically',
      enabled: distribute,
      action: 'distributeElements',
      options: {
        type: 'vertical'
      }
    }]
  }];
}

export function getBpmnEditMenu(state) {
  const {
    defaultCopyCutPaste,
    defaultUndoRedo
  } = state;

  const undoRedoEntries = defaultUndoRedo
    ? getDefaultUndoRedoEntries()
    : getUndoRedoEntries(state);

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    undoRedoEntries,
    copyCutPasteEntries,
    getToolEntries(state),
    getAlignDistributeEntries(state),
    getDiagramFindEntries(state),
    [
      ...getCanvasEntries(state),
      ...getSelectionEntries(state)
    ]
  ];
}