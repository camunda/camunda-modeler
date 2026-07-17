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

export default function(platform) {

  const isMac = platform === 'darwin';

  const modifierKey = isMac ? 'Command' : 'Control';

  return [
    {
      id: 'file',
      title: 'File',
      shortcuts: [
        {
          id: 'newFile',
          label: 'New File',
          binding: keyboardBinding('N', modifierKey)
        },
        {
          id: 'openFile',
          label: 'Open File',
          binding: keyboardBinding('O', modifierKey)
        },
        {
          id: 'reopenFile',
          label: 'Reopen Last File',
          binding: keyboardBinding('Shift + T', modifierKey)
        },
        {
          id: 'save',
          label: 'Save File',
          binding: keyboardBinding('S', modifierKey)
        },
        {
          id: 'saveAs',
          label: 'Save File As',
          binding: keyboardBinding('Shift + S', modifierKey)
        },
        {
          id: 'saveAll',
          label: 'Save All Files',
          binding: keyboardBinding('Alt + S', modifierKey)
        },
        {
          id: 'exportAsImage',
          label: 'Export As Image',
          binding: keyboardBinding('Shift + E', modifierKey)
        },
        {
          id: 'closeTab',
          label: 'Close Tab',
          binding: keyboardBinding('W', modifierKey)
        },
        {
          id: 'settings',
          label: 'Settings',
          binding: keyboardBinding(',', modifierKey)
        },
        {
          id: 'quit',
          label: 'Quit',
          binding: keyboardBinding('Q', modifierKey)
        }
      ]
    },
    {
      id: 'edit',
      title: 'Edit',
      shortcuts: [
        {
          id: 'undo',
          label: 'Undo',
          binding: keyboardBinding('Z', modifierKey)
        },
        {
          id: 'redo',
          label: 'Redo',
          binding: isMac ? 'Command + Shift + Z' : keyboardBinding('Y', modifierKey)
        },
        {
          id: 'copy',
          label: 'Copy',
          binding: keyboardBinding('C', modifierKey)
        },
        {
          id: 'copyAsImage',
          label: 'Copy as Image',
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
          id: 'selectAll',
          label: 'Select All',
          binding: keyboardBinding('A', modifierKey)
        },
        {
          id: 'removeSelected',
          label: 'Remove Selected',
          binding: keyboardBinding('Delete')
        },
        {
          id: 'find',
          label: 'Find',
          binding: keyboardBinding('F', modifierKey)
        },
        {
          id: 'addLineFeed',
          label: 'Add Line Feed (in text box)',
          binding: keyboardBinding('Shift + Enter')
        }
      ]
    },
    {
      id: 'modeling',
      title: 'Modeling',
      shortcuts: [
        {
          id: 'editLabel',
          label: 'Edit Label',
          binding: keyboardBinding('E')
        },
        {
          id: 'replaceElement',
          label: 'Replace Element',
          binding: keyboardBinding('R')
        },
        {
          id: 'appendElement',
          label: 'Append Element',
          binding: keyboardBinding('A')
        },
        {
          id: 'createElement',
          label: 'Create Element',
          binding: keyboardBinding('N')
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      shortcuts: [
        {
          id: 'handTool',
          label: 'Hand Tool',
          binding: keyboardBinding('H')
        },
        {
          id: 'lassoTool',
          label: 'Lasso Tool',
          binding: keyboardBinding('L')
        },
        {
          id: 'spaceTool',
          label: 'Space Tool',
          binding: keyboardBinding('S')
        },
        {
          id: 'globalConnectTool',
          label: 'Global Connect Tool',
          binding: keyboardBinding('C')
        }
      ]
    },
    {
      id: 'view',
      title: 'View',
      shortcuts: [
        {
          id: 'zoomIn',
          label: 'Zoom In',
          binding: keyboardBinding('=', modifierKey)
        },
        {
          id: 'zoomOut',
          label: 'Zoom Out',
          binding: keyboardBinding('-', modifierKey)
        },
        {
          id: 'zoomActual',
          label: 'Zoom to Actual Size',
          binding: keyboardBinding('0', modifierKey)
        },
        {
          id: 'zoomFit',
          label: 'Zoom to Fit Diagram',
          binding: keyboardBinding('1', modifierKey)
        },
        {
          id: 'toggleProperties',
          label: 'Toggle Properties Panel',
          binding: keyboardBinding('P', modifierKey)
        },
        {
          id: 'toggleVariables',
          label: 'Toggle Variables Panel',
          binding: keyboardBinding('Alt + P', modifierKey)
        },
        {
          id: 'toggleBottomPanel',
          label: 'Toggle Bottom Panel',
          binding: keyboardBinding('B', modifierKey)
        },
        {
          id: 'toggleGrid',
          label: 'Toggle Grid',
          binding: keyboardBinding('G', modifierKey)
        },
        {
          id: 'fullscreen',
          label: 'Fullscreen',
          binding: isMac ? 'Control + Command + F' : keyboardBinding('F11')
        }
      ]
    },
    {
      id: 'window',
      title: 'Window',
      shortcuts: [
        {
          id: 'reload',
          label: 'Reload',
          binding: keyboardBinding('R', modifierKey)
        },
        {
          id: 'selectNextTab',
          label: 'Select Next Tab',
          binding: keyboardBinding('Control + Tab')
        },
        {
          id: 'selectPreviousTab',
          label: 'Select Previous Tab',
          binding: keyboardBinding('Control + Shift + Tab')
        }
      ]
    },
    {
      id: 'canvas',
      title: 'Canvas & Mouse',
      shortcuts: [
        {
          id: 'moveCanvas',
          label: 'Move Canvas',
          binding: keyboardBinding('Arrow Keys', modifierKey)
        },
        {
          id: 'moveCanvasAccelerated',
          label: 'Move Canvas (Accelerated)',
          binding: keyboardBinding('Shift + Arrow Keys', modifierKey)
        },
        {
          id: 'moveSelection',
          label: 'Move Selection',
          binding: keyboardBinding('Arrow Keys')
        },
        {
          id: 'moveSelectionAccelerated',
          label: 'Move Selection (Accelerated)',
          binding: keyboardBinding('Shift + Arrow Keys')
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
      ]
    }
  ];

}
