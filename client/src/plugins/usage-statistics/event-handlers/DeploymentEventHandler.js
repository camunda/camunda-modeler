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

const RELEVANT_TAB_TYPES = ['bpmn', 'dmn'];

// Sends a deployment event to ET everytime when a user triggers a deploy to
// the Camunda Engine, ignoring cmmn deployments
export default class DeploymentEventHandler extends BaseEventHandler {

  constructor(params) {

    const { onSend, subscribe } = params;

    super('deployment', onSend);

    subscribe('deployment.done', this.handleDeployment);
    subscribe('deployment.error', this.handleDeployment);
  }

  // @pinussilvestrus: empty for now, we will need this for further metrics
  // e.g. https://github.com/camunda/camunda-modeler/issues/1971
  generateMetrics = (file) => {
    return {};
  }

  handleDeployment = (event) => {
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
    const diagramMetrics = this.generateMetrics(file);

    let payload = {
      diagramType: type,
      deployment: {
        outcome,
        context
      },
      diagramMetrics
    };

    // (4) retrieve deployment error
    if (error) {
      payload.deployment.error = error.code;
    }

    this.sendToET(payload);
  }

}