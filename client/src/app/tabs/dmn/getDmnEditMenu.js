
import {
  getCopyCutPasteEntries,
  getDefaultCopyCutPasteEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../getEditMenu';

function getDecisionTableEntries({
  hasSelection
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