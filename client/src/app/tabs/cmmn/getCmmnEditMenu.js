import {
  getCanvasEntries,
  getCopyCutPasteEntries,
  getDefaultCopyCutPasteEntries,
  getDiagramFindEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../getEditMenu';

export function getCmmnEditMenu(state) {
  const { defaultCopyCutPaste } = state;

  const copyCutPasteEntries = defaultCopyCutPaste
    ? getDefaultCopyCutPasteEntries()
    : getCopyCutPasteEntries(state);

  return [
    getUndoRedoEntries(state),
    copyCutPasteEntries,
    getToolEntries(state),
    getDiagramFindEntries(state),
    [
      ...getCanvasEntries(state),
      ...getSelectionEntries(state)
    ]
  ];
}