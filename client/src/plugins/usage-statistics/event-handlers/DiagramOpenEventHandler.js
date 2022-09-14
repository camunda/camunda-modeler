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

import { getEngineProfile } from '../../../util/parse';

import { getCloudTemplates, getPlatformTemplates } from '../../../util/elementTemplates';

const HTTP_STATUS_PAYLOAD_TOO_BIG = 413;

const BINDING_TYPE_PROPERTY = 'property';
const ELEMENT_TEMPLATES_CONFIG_KEY = 'bpmn.elementTemplates';

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  CMMN: 'cmmn',
  FORM: 'form'
};

// Sends a diagramOpened event to ET when an user opens any diagram
// (create a new one or open from file).
export default class DiagramOpenEventHandler extends BaseEventHandler {

  constructor(props) {

    const {
      onSend,
      subscribe,
      config
    } = props;

    super('diagramOpened', onSend);

    this._config = config;

    subscribe('bpmn.modeler.created', async (context) => {

      const {
        tab
      } = context;

      const {
        file,
        type
      } = tab;

      return await this.onBpmnDiagramOpened(file, type);
    });

    subscribe('dmn.modeler.created', context => {
      const {
        file,
        type
      } = context.tab;

      return this.onDmnDiagramOpened(file, type);
    });

    subscribe('cmmn.modeler.created', () => {
      this.onDiagramOpened(types.CMMN);
    });

    subscribe('form.modeler.created', async (context) => {

      const {
        tab
      } = context;

      const {
        file
      } = tab;

      return await this.onFormOpened(file);
    });
  }

  generateMetrics = async (file, type) => {
    let metrics = {};

    if (file.contents) {
      metrics = await getMetrics(file, type);
    }

    return metrics;
  };

  onDiagramOpened = async (type, context = {}) => {

    if (!this.isEnabled()) {
      return;
    }

    const {
      elementTemplates,
      diagramMetrics,
      engineProfile
    } = context;

    const payload = {
      diagramType: type
    };

    if (elementTemplates) {
      payload.elementTemplates = elementTemplates;
      payload.elementTemplateCount = elementTemplates.length;
    }

    if (diagramMetrics) {
      payload.diagramMetrics = diagramMetrics;
    }

    if (engineProfile) {
      payload.engineProfile = engineProfile;
    }

    const response = await this.sendToET(payload);

    if (response && response.status === HTTP_STATUS_PAYLOAD_TOO_BIG) {

      // Payload too large, send again with smaller payload
      this.sendToET(omit(payload, [ 'elementTemplates' ]));
    }
  };

  onFormOpened = async (file, context = {}) => {

    const {
      contents
    } = file;

    if (contents) {

      try {
        const schema = (JSON.parse(contents));

        const {
          executionPlatform,
          executionPlatformVersion
        } = schema;

        if (executionPlatform) {

          const engineProfile = executionPlatformVersion ?
            { executionPlatform: executionPlatform, executionPlatformVersion: executionPlatformVersion }
            : { executionPlatform: executionPlatform };

          context = {
            engineProfile,
            ...context
          };
        }

      } catch (error) {
        return;
      }
    }

    return await this.onDiagramOpened(types.FORM, context);

  };

  onBpmnDiagramOpened = async (file, type, context = {}) => {

    const {
      contents
    } = file;

    const diagramMetrics = await this.generateMetrics(file, type);
    const engineProfile = await getEngineProfile(contents, type);
    const elementTemplates = await this.getElementTemplates(file, type);

    return await this.onDiagramOpened(types.BPMN, {
      diagramMetrics,
      engineProfile,
      elementTemplates,
      ...context
    });

  };

  onDmnDiagramOpened = async (file, type, context = {}) => {

    const {
      contents
    } = file;

    const engineProfile = await getEngineProfile(contents, type);

    return await this.onDiagramOpened(types.DMN, {
      engineProfile,
      ...context
    });
  };

  getElementTemplates = async (file, type) => {

    const config = this._config;

    const elementTemplates = await config.get(ELEMENT_TEMPLATES_CONFIG_KEY, file);

    if (!elementTemplates) {
      return [];
    }

    const elementTemplateFilter = getElementTemplatesFilter(type);

    return elementTemplateFilter(elementTemplates).map((elementTemplate) => {
      const { appliesTo, properties, icon } = elementTemplate;

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

      const reducedTemplate = {
        appliesTo,
        properties: propertyCounts
      };

      if (icon) {
        reducedTemplate.icon = true;
      }

      return reducedTemplate;
    });
  };
}


// helper ////////////////

function getElementTemplatesFilter(type) {
  if (type === 'cloud-bpmn') {
    return getCloudTemplates;
  }

  return getPlatformTemplates;
}
