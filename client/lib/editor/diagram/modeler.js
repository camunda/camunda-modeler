'use strict';

var BpmnJS = require('bpmn-js/lib/Modeler'),
    DmnJS = require('dmn-js/lib/Modeler');

var DiagramJsOrigin = require('diagram-js-origin');

var propertiesPanelModule = require('bpmn-js-properties-panel'),
    camundaModdlePackage = require('bpmn-js-properties-panel/lib/provider/camunda/camunda-moddle');

// Temporary fix till we find a solution for this
var initialDmnDiagram = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<Definitions xmlns="http://www.omg.org/spec/DMN/20130901"',
               'xmlns:camunda="http://camunda.org/schema/1.0/dmn"',
               'id="definitions"',
               'name="camunda"',
               'namespace="http://camunda.org/dmn">',
    '<ItemDefinition id="itemDefinition1">',
      '<typeDefinition>string</typeDefinition>',
    '</ItemDefinition>',
    '<ItemDefinition id="itemDefinition2">',
      '<typeDefinition>string</typeDefinition>',
    '</ItemDefinition>',
    '<Decision id="" name="">',
      '<DecisionTable id="decisionTable" isComplete="true" isConsistent="true">',
        '<clause id="clause1" name="">',
          '<inputExpression id="inputExpression1">',
            '<itemDefinition href="#itemDefinition1" />',
            '<text></text>',
          '</inputExpression>',
        '</clause>',
        '<clause id="clause2" name="" camunda:output="">',
          '<outputDefinition href="#itemDefinition2" />',
        '</clause>',
      '</DecisionTable>',
    '</Decision>',
  '</Definitions>'
].join('\n');

DmnJS.prototype.createDiagram = function(done) {
  this.importXML(initialDmnDiagram, done);
};

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
