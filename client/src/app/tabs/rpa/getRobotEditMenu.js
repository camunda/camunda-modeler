/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

function getXMLFindEntries() {
  return [ {
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
  } ];
}

function getXMLCopyCutPasteEntries() {
  return [
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }
  ];
}

export function getRPAEditMenu(state) {
  return [
    getUndoRedoEntries(state),
    getXMLCopyCutPasteEntries(),
    getXMLFindEntries()
  ];
}

function getUndoRedoEntries({
  redo,
  undo
}) {
  return [ {
    label: 'Undo',
    accelerator: 'CommandOrControl+Z',
    enabled: undo,
    action: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'CommandOrControl+Y',
    enabled: redo,
    action: 'redo'
  } ];
}