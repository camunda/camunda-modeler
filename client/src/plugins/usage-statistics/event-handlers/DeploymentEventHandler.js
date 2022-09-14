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
  getEngineProfile
} from '../../../util/parse';

const BPMN_TAB_TYPE = 'bpmn';
const CLOUD_BPMN_TAB_TYPE = 'cloud-bpmn';
const DMN_TAB_TYPE = 'dmn';
const CLOUD_DMN_TAB_TYPE = 'cloud-dmn';

// Tabs for which we send telemetry data on deployment
const RELEVANT_TAB_TYPES = [
  BPMN_TAB_TYPE,
  CLOUD_BPMN_TAB_TYPE,
  DMN_TAB_TYPE,
  CLOUD_DMN_TAB_TYPE
];

const DIAGRAM_BY_TAB_TYPE = {
  'bpmn': [ BPMN_TAB_TYPE, CLOUD_BPMN_TAB_TYPE ],
  'dmn': [ DMN_TAB_TYPE, CLOUD_DMN_TAB_TYPE ]
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

    if (getDiagramType(tabType) !== 'dmn' && file.contents) {
      metrics = await getMetrics(file, tabType);
    }

    return metrics;
  };

  handleDeployment = async (event) => {
    const {
      error,
      tab,
      context,
      targetType,
      deployedTo
    } = event;

    const {
      type,
      file
    } = tab;

    const {
      contents
    } = file;


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

    // (4) construct payload
    let payload = {
      diagramType: getDiagramType(type),
      deployment: {
        outcome,
        context
      },
      diagramMetrics
    };

    // (5) add engineProfile
    payload.engineProfile = await getEngineProfile(contents, type) || { };

    // (6) (potentially) add deployment error
    if (error) {
      payload.deployment.error = error.code;
    }

    // (7) (potentially) add target type
    if (targetType) {
      payload.deployment.targetType = targetType;
    }

    // (8) (potentially) add executionPlatform details
    if (deployedTo) {
      payload.deployment = {
        ...payload.deployment,
        ...deployedTo
      };
    }

    this.sendToET(payload);
  };

}


// helpers ////////////

function getDiagramType(tabType) {
  return find(keys(DIAGRAM_BY_TAB_TYPE), function(diagramType) {
    return DIAGRAM_BY_TAB_TYPE[diagramType].includes(tabType);
  });
}
