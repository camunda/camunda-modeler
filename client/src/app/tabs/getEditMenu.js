export function getUndoRedoEntries({
  canRedo,
  canUndo
}) {
  return [{
    label: 'Undo',
    accelerator: 'CommandOrControl+Z',
    enabled: canUndo,
    action: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'CommandOrControl+Y',
    enabled: canRedo,
    action: 'redo'
  }];
}

export function getToolEntries({
  editLabel,
  globalConnectTool,
  handTool,
  lassoTool,
  spaceTool
}) {
  const menuEntries = [];

  if (handTool !== undefined) {
    menuEntries.push({
      label: 'Hand Tool',
      accelerator: 'H',
      enabled: handTool,
      action: 'handTool'
    });
  }

  if (lassoTool !== undefined) {
    menuEntries.push({
      label: 'Lasso Tool',
      accelerator: 'L',
      enabled: lassoTool,
      action: 'lassoTool'
    });
  }

  if (spaceTool !== undefined) {
    menuEntries.push({
      label: 'Space Tool',
      accelerator: 'S',
      enabled: spaceTool,
      action: 'spaceTool'
    });
  }

  if (globalConnectTool !== undefined) {
    menuEntries.push({
      label: 'Global Connect Tool',
      accelerator: 'C',
      enabled: globalConnectTool,
      action: 'globalConnectTool'
    });
  }

  if (editLabel !== undefined) {
    menuEntries.push({
      label: 'Edit Label',
      accelerator: 'E',
      enabled: editLabel,
      action: 'editLabel'
    });
  }

  return menuEntries;
}

export function getDiagramFindEntries({
  find
}) {
  return [{
    label: 'Find',
    accelerator: 'CommandOrControl+F',
    enabled: find,
    action: 'find'
  }];
}

export function getCanvasEntries({
  moveCanvas,
  moveToOrigin
}) {
  const menuEntries = [];

  if (moveToOrigin !== undefined) {
    menuEntries.push({
      label: 'Move Elements To Origin',
      accelerator: 'CommandOrControl+Shift+O',
      enabled: moveToOrigin,
      action: 'moveToOrigin'
    });
  }

  return [
    ...menuEntries,
    {
      label: 'Move Canvas',
      enabled: moveCanvas,
      submenu: [ 'Up', 'Left', 'Down', 'Right' ].map(direction => {
        return {
          label: `Move ${direction}`,
          accelerator: direction,
          enabled: moveCanvas,
          action: 'moveCanvas',
          options: {
            direction: direction.toLowerCase()
          }
        };
      })
    }
  ];
}

export function getSelectionEntries({
  removeSelected,
  selectAll
}) {
  return [{
    label: 'Select All',
    accelerator: 'CommandOrControl+A',
    action: 'selectElements'
  }, {
    label: 'Remove Selected',
    accelerator: 'Delete',
    enabled: removeSelected,
    action: 'removeSelection'
  }];
}