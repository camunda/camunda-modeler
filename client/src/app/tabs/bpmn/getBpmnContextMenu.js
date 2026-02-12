/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

function getCopyPasteEntries({
  copy,
  paste
}) {
  return [ {
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    enabled: copy,
    action: 'copy'
  }, {
    label: 'Cut',
    accelerator: 'CommandOrControl+X',
    enabled: copy,
    action: 'cut'
  }, {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    enabled: paste,
    action: 'paste'
  } ];
}

export default function getBpmnContextMenu(state) {
  return getCopyPasteEntries(state);
}
