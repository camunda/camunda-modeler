import {
  getCanvasEntries,
  getDiagramFindEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../getEditMenu';

function getCopyPasteEntries({
  copy,
  paste
}) {
  return [{
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    enabled: copy,
    action: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    enabled: paste,
    action: 'paste'
  }];
}

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
      action: 'distributeHorizontally'
    }, {
      label: 'Distribute Vertically',
      enabled: distribute,
      action: 'distributeVertically'
    }]
  }];
}

export function getBpmnEditMenu(state) {
  return [
    getUndoRedoEntries(state),
    getCopyPasteEntries(state),
    getToolEntries(state),
    getAlignDistributeEntries(state),
    getDiagramFindEntries(state),
    [
      ...getCanvasEntries(state),
      ...getSelectionEntries(state)
    ]
  ];
}