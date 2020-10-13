/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class EditorActions {
  constructor(commandStack, editorActions, selection) {
    editorActions.register('applyElementTemplate', elementTemplate => {
      const selectedElements = selection.get();

      if (selectedElements.length !== 1) {
        return false;
      }

      const element = selectedElements[ 0 ];

      commandStack.execute('propertiesPanel.camunda.changeTemplate', {
        element,
        newTemplate: elementTemplate
      });

      return true;
    });

    editorActions.register('getSelectedElement', () => {
      const selectedElements = selection.get();

      if (selectedElements.length !== 1) {
        return null;
      }

      return selectedElements[ 0 ];
    });

    editorActions.register('getSelectedElementAppliedElementTemplate', () => {
      const selectedElements = selection.get();

      if (selectedElements.length !== 1) {
        return null;
      }

      const { businessObject } = selectedElements[ 0 ];

      return businessObject.get('camunda:modelerTemplate') || null;
    });
  }
}

EditorActions.$inject = [
  'commandStack',
  'editorActions',
  'selection'
];