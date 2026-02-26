/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import dragTabs from 'drag-tabs';

const noop = () => {};

export function addDragger(node, options, onDrag, onStart = noop, onCancel = noop) {

  const dragger = dragTabs(node, options);

  dragger.on('drag', onDrag);
  dragger.on('start', onStart);

  dragger.on('cancel', onCancel);

  return dragger;
}