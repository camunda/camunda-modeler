/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function applyDefaultTemplates(elementRegistry, elementTemplates, commandStack) {
  const elements = elementRegistry.getAll();

  const commands = elements.reduce((currentCommands, element) => {
    const template = elementTemplates.getDefault(element);

    if (!template) {
      return currentCommands;
    }

    const command = getChangeTemplateCommand(element, template);

    return [ ...currentCommands, command ];
  }, []);

  if (commands.length === 0) {
    return;
  }

  commandStack.execute('properties-panel.multi-command-executor', commands);

  commandStack.clear();
}

applyDefaultTemplates.$inject = [
  'elementRegistry',
  'elementTemplates',
  'commandStack'
];



// helpers //////////
function getChangeTemplateCommand(element, template) {
  return {
    cmd: 'propertiesPanel.camunda.changeTemplate',
    context: {
      element,
      newTemplate: template
    }
  };
}
