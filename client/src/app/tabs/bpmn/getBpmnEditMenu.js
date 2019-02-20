/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  getCanvasEntries,
  getCopyCutPasteEntries,
  getDefaultCopyCutPasteEntries,
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
  const { defaultCopyCutPaste } = state;

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    getUndoRedoEntries(state),
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