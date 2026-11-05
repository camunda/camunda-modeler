/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

/**
 * PROTOTYPE: fake "AI" changes to a task, applied as a single (undoable)
 * command via `diffDemo.implementWithAi` with `{ element }`.
 */
export default function ImplementWithAiHandler(modeling, bpmnFactory) {
  this._modeling = modeling;
  this._bpmnFactory = bpmnFactory;
}

ImplementWithAiHandler.$inject = [ 'modeling', 'bpmnFactory' ];

ImplementWithAiHandler.prototype.preExecute = function(context) {
  const { element } = context;

  const modeling = this._modeling;

  const businessObject = getBusinessObject(element);

  modeling.updateProperties(element, { name: 'Prepare order payload' });

  modeling.updateModdleProperties(element, businessObject, {
    documentation: [
      this._create('bpmn:Documentation', {
        text: 'This service task prepares customer and order data for the payment step'
      }, businessObject)
    ]
  });

  const taskDefinition = this._ensureExtension(element, 'zeebe:TaskDefinition');

  modeling.updateModdleProperties(element, taskDefinition, {
    type: 'prepare-order-payload',
    retries: '5'
  });

  const ioMapping = this._ensureExtension(element, 'zeebe:IoMapping');

  modeling.updateModdleProperties(element, ioMapping, {
    inputParameters: ioMapping.get('inputParameters').filter(input => input.get('target') !== 'foo')
  });

  const customer = ioMapping.get('outputParameters').find(output => output.get('target') === 'customer');

  if (customer) {
    modeling.updateModdleProperties(element, customer, {
      source: '={ name: "Ada", tier: "platinum", active: true }'
    });
  }

  const outputs = ioMapping.get('outputParameters').filter(output => output.get('target') !== 'serviceConfig');

  if (!outputs.some(output => output.get('target') === 'preparedAt')) {
    outputs.push(this._create('zeebe:Output', { source: '=now()', target: 'preparedAt' }, ioMapping));
  }

  modeling.updateModdleProperties(element, ioMapping, { outputParameters: outputs });

  const taskHeaders = this._ensureExtension(element, 'zeebe:TaskHeaders');

  if (!taskHeaders.get('values').some(header => header.get('key') === 'priority')) {
    modeling.updateModdleProperties(element, taskHeaders, {
      values: [
        ...taskHeaders.get('values'),
        this._create('zeebe:Header', { key: 'priority', value: 'high' }, taskHeaders)
      ]
    });
  }
};

ImplementWithAiHandler.prototype._create = function(type, attrs, parent) {
  const element = this._bpmnFactory.create(type, attrs);

  element.$parent = parent;

  return element;
};

ImplementWithAiHandler.prototype._ensureExtension = function(element, type) {
  const modeling = this._modeling;

  const businessObject = getBusinessObject(element);

  let extensionElements = businessObject.get('extensionElements');

  if (!extensionElements) {
    extensionElements = this._create('bpmn:ExtensionElements', { values: [] }, businessObject);

    modeling.updateModdleProperties(element, businessObject, { extensionElements });
  }

  let extension = extensionElements.get('values').find(value => value.$instanceOf(type));

  if (!extension) {
    extension = this._create(type, {}, extensionElements);

    modeling.updateModdleProperties(element, extensionElements, {
      values: [ ...extensionElements.get('values'), extension ]
    });
  }

  return extension;
};
