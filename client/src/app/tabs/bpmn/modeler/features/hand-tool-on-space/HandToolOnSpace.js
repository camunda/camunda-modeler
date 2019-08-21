/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function HandToolOnSpace(dragging, editorActions, handTool) {
  function activateMove(event) {
    handTool.activateMove(event);

    window.removeEventListener('mousemove', activateMove);
  }

  editorActions.register('activateHandtool', function() {
    if (handTool.isActive()) {
      return;
    }

    window.addEventListener('mousemove', activateMove);
  });

  editorActions.register('deactivateHandtool', function() {
    window.removeEventListener('mousemove', activateMove);

    dragging.cancel();
  });
}

HandToolOnSpace.$inject = [
  'dragging',
  'editorActions',
  'handTool'
];