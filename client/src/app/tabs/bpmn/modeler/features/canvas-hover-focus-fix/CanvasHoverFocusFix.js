/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class CanvasHoverFocusFix {

  constructor(canvas) {
    const restoreFocus = canvas.restoreFocus.bind(canvas);

    canvas.restoreFocus = () => {
      const selection = document.getSelection && document.getSelection();

      if (selection && !selection.isCollapsed && selection.toString()) {

        // user has selectable text selected (e.g. in the task testing
        // panel) - keep it; focusing the canvas would clear it
        return;
      }

      restoreFocus();
    };
  }
}

CanvasHoverFocusFix.$inject = [ 'canvas' ];
