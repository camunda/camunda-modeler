/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class CanvasResizedReposition {

  constructor(eventBus, contextPad) {
    eventBus.on('canvas.resized', () => {

      // canvas resizes (e.g. properties panel moved) do not change the
      // viewbox, so the pad never repositions on its own
      contextPad._updatePosition();
      contextPad._updateVisibility();
    });
  }
}

CanvasResizedReposition.$inject = [ 'eventBus', 'contextPad' ];
