/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

import CreateMenuPopover from './CreateMenuPopover';

/**
 * Diagram-js service that mounts a React-based create menu popover.
 * Self-contained — no external React wiring needed.
 */
export default function CreateMenuRenderer(eventBus, popupMenu, canvas) {
  const container = document.createElement('div');
  container.setAttribute('data-create-menu', '');
  document.body.appendChild(container);

  const root = createRoot(container);

  root.render(
    <CreateMenuPopover
      eventBus={ eventBus }
      popupMenu={ popupMenu }
      canvas={ canvas }
    />
  );

  eventBus.on('diagram.destroy', () => {
    root.unmount();
    container.remove();
  });
}

CreateMenuRenderer.$inject = [
  'eventBus',
  'popupMenu',
  'canvas'
];
