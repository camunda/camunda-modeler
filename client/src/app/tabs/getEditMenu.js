export function getCanvasEntries({
  moveCanvas,
  moveToOrigin,
  moveSelection
}) {
  const menuEntries = [];

  if (isDefined(moveToOrigin)) {
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
      submenu: [ 'Up', 'Left', 'Down', 'Right' ].reduce((entries, direction) => {
        return [
          ...entries,
          {
            label: `${direction}`,
            accelerator: `CommandOrControl + ${direction}`,
            enabled: moveCanvas,
            action: 'moveCanvas',
            options: {
              direction: direction.toLowerCase(),
              speed: 50
            }
          },
          {
            label: `${direction} (Accelerated)`,
            accelerator: `CommandOrControl + Shift + ${direction}`,
            enabled: moveCanvas,
            action: 'moveCanvas',
            options: {
              direction: direction.toLowerCase(),
              speed: 200
            }
          }
        ];
      }, [])
    },
    {
      label: 'Move Selection',
      enabled: moveSelection,
      submenu: [ 'Up', 'Left', 'Down', 'Right' ].reduce((entries, direction) => {
        return [
          ...entries,
          {
            label: `${direction}`,
            accelerator: direction,
            enabled: moveSelection,
            action: 'moveSelection',
            options: {
              direction: direction.toLowerCase()
            }
          },
          {
            label: `${direction} (Accelerated)`,
            accelerator: `Shift + ${direction}`,
            enabled: moveSelection,
            action: 'moveSelection',
            options: {
              direction: direction.toLowerCase(),
              accelerated: true
            }
          }
        ];
      }, [])
    }
  ];
}

export function getCopyCutPasteEntries({
  copy,
  cut,
  paste
}) {
  return [{
    label: 'Copy',
    accelerator: 'CommandOrControl + C',
    enabled: copy,
    action: 'copy',
  }, {
    label: 'Cut',
    accelerator: 'CommandOrControl + X',
    enabled: cut,
    action: 'cut'
  }, {
    label: 'Paste',
    accelerator: 'CommandOrControl + V',
    enabled: paste,
    action: 'paste'
  }];
}

export function getDefaultCopyCutPasteEntries() {
  return [{
    label: 'Copy',
    role: 'copy'
  }, {
    label: 'Cut',
    role: 'cut'
  }, {
    label: 'Paste',
    role: 'paste'
  }];
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

export function getSelectionEntries({
  inputActive,
  removeSelected,
  selectAll
}) {
  const menuEntries = [];

  if (isDefined(selectAll)) {
    menuEntries.push({
      label: 'Select All',
      accelerator: 'CommandOrControl + A',
      enabled: selectAll,
      action: 'selectElements',
      role: inputActive && 'selectAll'
    });
  }

  if (isDefined(removeSelected)) {
    menuEntries.push({
      label: 'Remove Selected',
      accelerator: 'Delete',
      enabled: removeSelected,
      action: 'removeSelection',
      role: inputActive && 'delete'
    });
  }

  return menuEntries;
}

export function getToolEntries({
  editLabel,
  globalConnectTool,
  handTool,
  lassoTool,
  spaceTool
}) {
  const menuEntries = [];

  if (isDefined(handTool)) {
    menuEntries.push({
      label: 'Hand Tool',
      accelerator: 'H',
      enabled: handTool,
      action: 'handTool'
    });
  }

  if (isDefined(lassoTool)) {
    menuEntries.push({
      label: 'Lasso Tool',
      accelerator: 'L',
      enabled: lassoTool,
      action: 'lassoTool'
    });
  }

  if (isDefined(spaceTool)) {
    menuEntries.push({
      label: 'Space Tool',
      accelerator: 'S',
      enabled: spaceTool,
      action: 'spaceTool'
    });
  }

  if (isDefined(globalConnectTool)) {
    menuEntries.push({
      label: 'Global Connect Tool',
      accelerator: 'C',
      enabled: globalConnectTool,
      action: 'globalConnectTool'
    });
  }

  if (isDefined(editLabel)) {
    menuEntries.push({
      label: 'Edit Label',
      accelerator: 'E',
      enabled: editLabel,
      action: 'directEditing'
    });
  }

  return menuEntries;
}

export function getUndoRedoEntries({
  redo,
  undo
}) {
  return [{
    label: 'Undo',
    accelerator: 'CommandOrControl+Z',
    enabled: undo,
    action: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'CommandOrControl+Y',
    enabled: redo,
    action: 'redo'
  }];
}

// helpers //////////

function isDefined(value) {
  return value !== undefined;
}