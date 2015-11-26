'use strict';

var BpmnJS = require('bpmn-js/lib/Modeler'),
    DmnJS = require('dmn-js/lib/Modeler');

var DiagramJsOrigin = require('diagram-js-origin');

var propertiesPanelModule = require('bpmn-js-properties-panel'),
    propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
    camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda');


function createBpmnJS($el, $propertiesPanel) {

  var propertiesPanelConfig = {
    'config.propertiesPanel': ['value', { parent: $propertiesPanel }]
  };

  return new BpmnJS({
    container: $el,
    position: 'absolute',
    additionalModules: [
      DiagramJsOrigin,
      propertiesPanelModule,
      propertiesProviderModule,
      propertiesPanelConfig
    ],
    moddleExtensions: { camunda: camundaModdlePackage }
  });
}

function createDmnJS($el) {
  return new DmnJS({
    container: $el,
    tableName: "DMN Table",
    position: 'absolute'
  });
}

function createModeler(type, $el, $propertiesPanel) {
  if (type === 'dmn') {
    return createDmnJS($el);
  }
  return createBpmnJS($el, $propertiesPanel);
}

module.exports = createModeler;
