/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 *
 * @param {import('diagram-js/lib/features/editor-actions/EditorActions').default} editorActions
 */
export function EditorActions(editorActions) {
  editorActions.register({
    appendElement: function(...args) {
      return editorActions.trigger('appendCreatePad', ...args);
    }
  });
}

EditorActions.$inject = [ 'editorActions' ];
