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
  getDefaultCopyCutPasteEntries,
  getDefaultUndoRedoEntries
} from '../getEditMenu';

export function getCopyCutPasteEntries(state) {
  const { inputActive } = state;

  return getDefaultCopyCutPasteEntries(inputActive);
}

export function getUndoRedoEntries(state) {
  const { inputActive } = state;

  return getDefaultUndoRedoEntries(inputActive);
}

export function getFormEditMenu(state) {
  return [
    getUndoRedoEntries(state),
    getCopyCutPasteEntries(state)
  ];
}
