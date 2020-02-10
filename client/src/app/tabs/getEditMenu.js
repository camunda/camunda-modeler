/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Flags, { DISABLE_ADJUST_ORIGIN } from '../../util/Flags';

const SPACE_KEY = ' ';

export function getAlignDistributeEntries({
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

export function getCanvasEntries({
  moveCanvas,
  moveToOrigin,
  moveSelection
}) {
  const menuEntries = [];

  if (isDefined(moveToOrigin) && Flags.get(DISABLE_ADJUST_ORIGIN)) {
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
  bpmn,
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

    bpmn && handTool && menuEntries.push({
      visible: false,
      label: 'I\'m invisible!',
      custom: {
        key: SPACE_KEY,
        keypress: 'activateHandtool',
        keyup: 'deactivateHandtool'
      }
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

// undo and redo must be handled manually due to a bug in Chromium
// see https://github.com/electron/electron/issues/3682
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

export function getDefaultUndoRedoEntries() {
  return [{
    label: 'Undo',
    role: 'undo'
  }, {
    label: 'Redo',
    role: 'redo'
  }];
}

// helpers //////////

function isDefined(value) {
  return value !== undefined;
}
