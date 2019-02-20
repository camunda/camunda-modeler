/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import dragTabs from 'drag-tabs';

const noop = () => {};

export function addDragger(node, options, onDrag, onStart=noop) {

  const dragger = dragTabs(node, options);

  dragger.on('drag', onDrag);
  dragger.on('start', onStart);

  dragger.on('cancel', onDrag);

  return dragger;
}