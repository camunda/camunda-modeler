import {
  getDefaultTemplate
} from 'bpmn-js-properties-panel/lib/provider/camunda/element-templates/Helper';


export default function applyDefaultTemplates(eventBus, elementRegistry, elementTemplates, commandStack) {
  eventBus.on('import.done', () => {
    const elements = elementRegistry.getAll();

    const commands = elements.reduce((currentCommands, element) => {
      const template = getDefaultTemplate(element, elementTemplates);

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
  });
}

applyDefaultTemplates.$inject = [
  'eventBus',
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
