/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import scrollTabs from 'scroll-tabs';

export function addScroller(node, options, onScroll) {
  const scroller = scrollTabs(node, options);

  scroller.on('scroll', onScroll);

  scroller.update = scroller.update.bind(scroller);

  window.addEventListener('resize', scroller.update);

  return scroller;
}

export function removeScroller(scroller) {
  window.removeEventListener('resize', scroller.update);
}