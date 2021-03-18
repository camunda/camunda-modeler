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
  constructor(commandStack, editorActions, selection, canvas) {

    // Register action to apply an element template to the selected element
    editorActions.register('applyElementTemplate', elementTemplate => {
      const element = getSelectedElement();

      if (element) {
        commandStack.execute('propertiesPanel.camunda.changeTemplate', {
          element,
          newTemplate: elementTemplate
        });

        return true;
      }

      return false;
    });

    // Register action to get the currently selected element
    editorActions.register('getSelectedElement', () => {
      return getSelectedElement();
    });

    // Register action to get the template applied to the currently selected element
    editorActions.register('getSelectedElementAppliedElementTemplate', () => {
      const selectedElement = getSelectedElement();

      if (selectedElement) {
        const { businessObject } = selectedElement;

        return businessObject.get('camunda:modelerTemplate') || null;
      }

      return null;
    });

    // helper //////////////////////////////////

    /**
    * Get the currently selected element. If no explicit selection is made, the
    * root element is returned. If multiple elements are selected, null is returned.
    *
    * @returns {Shape} selected element or root element
    */
    function getSelectedElement() {
      const selectedElements = selection.get();

      if (selectedElements.length > 1 || selectedElements.length < 0) {
        return null;
      }

      if (selectedElements.length === 1) {
        return selectedElements[ 0 ];
      }

      if (selectedElements.length === 0) {
        return canvas.getRootElement();
      }
    }
  }
}

EditorActions.$inject = [
  'commandStack',
  'editorActions',
  'selection',
  'canvas'
];
