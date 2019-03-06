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
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../getEditMenu';

function getDecisionTableEntries({
  hasSelection,
  inputActive
}) {
  return [
    [
      {
        label: 'Add Rule',
        submenu: [{
          label: 'At End',
          accelerator: 'CommandOrControl+D',
          action: 'addRule'
        }, {
          label: 'Above Selected',
          enabled: hasSelection,
          action: 'addRuleAbove'
        }, {
          label: 'Below Selected',
          enabled: hasSelection,
          action: 'addRuleBelow'
        }]
      }, {
        label: 'Remove Rule',
        enabled: hasSelection,
        action: 'removeRule'
      }
    ], [
      {
        label: 'Add Clause',
        submenu: [{
          label: 'Input',
          action: 'addInput'
        }, {
          label: 'Output',
          action: 'addOutput'
        },
        {
          type: 'separator'
        },
        {
          label: 'Left Of Selected',
          enabled: hasSelection,
          action: 'addClauseLeft'
        },
        {
          label: 'Right Of Selected',
          enabled: hasSelection,
          action: 'addClauseRight'
        }]
      }, {
        label: 'Remove Clause',
        enabled: hasSelection,
        action: 'removeClause'
      }
    ], [
      {
        label: 'Select Cell Above',
        accelerator: 'Shift + Enter',
        enabled: hasSelection,
        action: 'selectCellAbove',
        role: inputActive && 'selectCellAbove'
      },
      {
        label: 'Select Cell Below',
        accelerator: 'Enter',
        enabled: hasSelection,
        action: 'selectCellBelow',
        role: inputActive && 'selectCellBelow'
      }
    ]
  ];
}

export function getDmnDrdEditMenu(state) {
  const { defaultCopyCutPaste } = state;

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    getUndoRedoEntries(state),
    copyCutPasteEntries,
    getToolEntries(state),
    getCanvasEntries(state),
    getSelectionEntries(state)
  ];
}

export function getDmnDecisionTableEditMenu(state) {
  const { defaultCopyCutPaste } = state;

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    getUndoRedoEntries(state),
    copyCutPasteEntries,
    getSelectionEntries(state),
    ...getDecisionTableEntries(state)
  ];
}

export function getDmnLiteralExpressionEditMenu(state) {
  const { defaultCopyCutPaste } = state;

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    getUndoRedoEntries(state),
    copyCutPasteEntries,
    getSelectionEntries(state)
  ];
}