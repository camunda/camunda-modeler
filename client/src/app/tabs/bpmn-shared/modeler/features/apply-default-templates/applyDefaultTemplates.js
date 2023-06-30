/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function applyDefaultTemplates(elementRegistry, elementTemplates, commandStack, changeTemplateCommand) {

  if (!changeTemplateCommand) {
    throw new Error('<config.changeTemplateCommand> not provided');
  }

  const elements = elementRegistry.getAll();

  const commands = elements.reduce((currentCommands, element) => {
    const template = elementTemplates.getDefault(element);

    if (!template) {
      return currentCommands;
    }

    const command = getChangeTemplateCommand(element, template, changeTemplateCommand);

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
  'commandStack',
  'config.changeTemplateCommand'
];



// helpers //////////
function getChangeTemplateCommand(element, template, cmd) {
  return {
    cmd: cmd,
    context: {
      element,
      newTemplate: template
    }
  };
}
