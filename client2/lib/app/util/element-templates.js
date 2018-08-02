'use strict';

import {
  forEach
} from 'min-dash';

var getDefaultTemplate = require('bpmn-js-properties-panel/lib/provider/camunda/element-templates/Helper').getDefaultTemplate;


function applyElementTemplates(elements, modeler) {

  var elementTemplates = modeler.get('elementTemplates');
  var commandStack = modeler.get('commandStack');

  var commands = [];

  forEach(elements, function(element) {
    var template = getDefaultTemplate(element, elementTemplates);

    if (!template) {
      return;
    }

    commands.push({
      cmd: 'propertiesPanel.camunda.changeTemplate',
      context: {
        element: element,
        newTemplate: template
      }
    });
  });

  if (commands.length === 0) {
    return;
  }

  commandStack.execute('properties-panel.multi-command-executor', commands);
}

module.exports.applyElementTemplates = applyElementTemplates;
