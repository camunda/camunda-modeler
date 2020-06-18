/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BaseEventHandler from './BaseEventHandler';

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn'
};

// Sends a diagramOpened event to ET with diagram-type: bpmn/dmn payload
// when a user opens a BPMN or DMN diagram (create a new one or open from file).
export default class DiagramOpenEventHandler extends BaseEventHandler {

  constructor(params) {

    const { onSend, subscribe } = params;

    super('diagramOpened', onSend);

    subscribe('bpmn.modeler.created', () => {
      this.onDiagramOpened(types.BPMN);
    });

    subscribe('dmn.modeler.created', () => {
      this.onDiagramOpened(types.DMN);
    });
  }

  onDiagramOpened = (type) => {
    this.sendToET({ 'diagram-type': type });
  }
}
