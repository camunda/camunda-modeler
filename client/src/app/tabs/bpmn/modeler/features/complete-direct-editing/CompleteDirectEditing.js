/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function CompleteDirectEditing(editorActions, injector) {
  editorActions.register('saveTab.start', function() {
    var directEditing = injector.get('directEditing', false);

    if (directEditing && directEditing.isActive()) {
      directEditing.complete();
    }
  });
}

CompleteDirectEditing.$inject = [
  'editorActions',
  'injector'
];
