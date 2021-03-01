/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  find,
  keys
} from 'min-dash';

import BaseEventHandler from './BaseEventHandler';

import {
  getMetrics
} from '../../../util';

import {
  getEngineProfile as parseEngineProfile
} from '../../../util/parse';

const BPMN_TAB_TYPE = 'bpmn';
const CLOUD_BPMN_TAB_TYPE = 'cloud-bpmn';
const DMN_TAB_TYPE = 'dmn';

const RELEVANT_TAB_TYPES = [
  BPMN_TAB_TYPE,
  CLOUD_BPMN_TAB_TYPE,
  DMN_TAB_TYPE
];

const DIAGRAM_BY_TAB_TYPE = {
  'bpmn': [ BPMN_TAB_TYPE, CLOUD_BPMN_TAB_TYPE],
  'dmn': [ DMN_TAB_TYPE ]
};

// Sends a deployment event to ET everytime when a user triggers a deployment
export default class DeploymentEventHandler extends BaseEventHandler {

  constructor(params) {

    const { onSend, subscribe } = params;

    super('deployment', onSend);

    subscribe('deployment.done', this.handleDeployment);
    subscribe('deployment.error', this.handleDeployment);
  }

  generateMetrics = async (file, tabType) => {
    let metrics = {};

    if (tabType !== 'dmn' && file.contents) {
      metrics = await getMetrics(file, tabType);
    }

    return metrics;
  }

  getEngineProfile = async (file) => {
    const {
      contents
    } = file;

    if (!contents) {
      return {};
    }

    return await parseEngineProfile(contents);
  }

  handleDeployment = async (event) => {
    const {
      error,
      tab,
      context
    } = event;

    const {
      type,
      file
    } = tab;

    // (0) check whether usage statistics are enabled
    if (!this.isEnabled()) {
      return;
    }

    // (1) ensure bpmn or dmn deployments
    if (!RELEVANT_TAB_TYPES.includes(type)) {
      return;
    }

    // (2) retrieve deployment status
    const outcome = error ? 'failure' : 'success';

    // (3) generate diagram related metrics, e.g. process variables
    const diagramMetrics = await this.generateMetrics(file, type);

    // (4) retrieve engine profile
    const engineProfile = await this.getEngineProfile(file);

    let payload = {
      diagramType: getDiagramType(type),
      deployment: {
        outcome,
        context
      },
      diagramMetrics,
      engineProfile
    };

    // (5) retrieve deployment error
    if (error) {
      payload.deployment.error = error.code;
    }

    this.sendToET(payload);
  }

}


// helpers ////////////

function getDiagramType(tabType) {
  return find(keys(DIAGRAM_BY_TAB_TYPE), function(diagramType) {
    return DIAGRAM_BY_TAB_TYPE[diagramType].includes(tabType);
  });
}