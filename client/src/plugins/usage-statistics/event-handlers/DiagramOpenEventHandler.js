/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { omit } from 'min-dash';

import BaseEventHandler from './BaseEventHandler';

import { getMetrics } from '../../../util';

const HTTP_STATUS_PAYLOAD_TOO_BIG = 413;

const BINDING_TYPE_PROPERTY = 'property';
const ELEMENT_TEMPLATES_CONFIG_KEY = 'bpmn.elementTemplates';

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  CMMN: 'cmmn'
};

// Sends a diagramOpened event to ET with diagram type: bpmn/dmn payload
// when a user opens a BPMN, DMN or CMMN diagram (create a new one or open from file).
export default class DiagramOpenEventHandler extends BaseEventHandler {

  constructor(params) {

    const { onSend, subscribe, config } = params;

    super('diagramOpened', onSend);

    subscribe('bpmn.modeler.created', async (info) => {

      const { tab } = info;
      const { file } = tab;

      const elementTemplates = await this.getElementTemplates(config, file);

      const diagramMetrics = await this.generateMetrics(file);

      this.onDiagramOpened(types.BPMN, {
        elementTemplates,
        diagramMetrics
      });
    });

    subscribe('dmn.modeler.created', () => {
      this.onDiagramOpened(types.DMN);
    });

    subscribe('cmmn.modeler.created', () => {
      this.onDiagramOpened(types.CMMN);
    });
  }

  generateMetrics = async (file) => {
    let metrics = {};

    // (1) telemetry metrics
    if (file.contents) {
      metrics = await getMetrics(file);
    }

    return metrics;
  }

  onDiagramOpened = async (type, context = {}) => {

    if (!this.isEnabled()) {
      return;
    }

    const {
      elementTemplates,
      diagramMetrics
    } = context;

    const payload = { diagramType: type };

    if (elementTemplates) {
      payload.elementTemplates = elementTemplates;
      payload.elementTemplateCount = elementTemplates.length;
    }

    if (diagramMetrics) {
      payload.diagramMetrics = diagramMetrics;
    }

    const response = await this.sendToET(payload);

    if (response.status === HTTP_STATUS_PAYLOAD_TOO_BIG) {

      // Payload too large, send again with smaller payload
      this.sendToET(omit(payload, ['elementTemplates']));
    }
  }

  getElementTemplates = async (config, file) => {

    const elementTemplates = await config.get(ELEMENT_TEMPLATES_CONFIG_KEY, file);

    if (!elementTemplates) {
      return [];
    }

    return elementTemplates.map((elementTemplate) => {
      const { appliesTo, properties } = elementTemplate;

      const propertyCounts = properties.map((property) => {

        const { binding } = property;
        const { type, name } = binding;

        if (type === BINDING_TYPE_PROPERTY) {
          return name;
        }

        return type;
      }).reduce((propertyCounts, property) => {

        if (propertyCounts[ property ]) {

          propertyCounts[ property ]++;
        } else {

          propertyCounts[ property ] = 1;
        }

        return propertyCounts;
      }, {});

      return { appliesTo, properties: propertyCounts };
    });
  }
}
