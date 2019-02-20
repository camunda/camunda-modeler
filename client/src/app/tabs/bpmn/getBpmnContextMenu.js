/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function getCopyPasteEntries({
  copy,
  paste
}) {
  return [{
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    enabled: copy,
    action: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    enabled: paste,
    action: 'paste'
  }];
}

export default function getBpmnContextMenu(state) {
  return getCopyPasteEntries(state);
}
