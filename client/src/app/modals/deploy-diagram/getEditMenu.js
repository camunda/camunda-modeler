/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function getEditMenu(enabled) {
  return [
    [
      {
        role: 'undo',
        enabled
      },
      {
        role: 'redo',
        enabled
      },
    ],
    [
      {
        role: 'copy',
        enabled
      },
      {
        role: 'cut',
        enabled
      },
      {
        role: 'paste',
        enabled
      },
      {
        role: 'selectAll',
        enabled
      }
    ]
  ];
}
