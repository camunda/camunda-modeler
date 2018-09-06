import {
  getUndoRedoEntries
} from '../getEditMenu';

function getXMLFindEntries() {
  return [{
    label: 'Find',
    accelerator: 'CommandOrControl+F',
    action: 'find'
  }, {
    label: 'Find Next',
    accelerator: 'Shift+CommandOrControl+N',
    action: 'findNext'
  }, {
    label: 'Find Previous',
    accelerator: 'Shift+CommandOrControl+P',
    action: 'findPrev'
  }, {
    label: 'Replace',
    accelerator: 'Shift+CommandOrControl+F',
    action: 'replace'
  }];
}

export function getXMLEditMenu(state) {
  return [
    getUndoRedoEntries(state),
    getXMLFindEntries()
  ];
}