/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from 'debug';

import { getOperateUrl } from '../../../../plugins/zeebe-plugin/shared/util';

const log = debug('TaskTestingApi');

export default class TaskTestingApi {
  constructor(deployment, startInstance, zeebeApi, tab, onAction) {
    this._deployment = deployment;
    this._startInstance = startInstance;
    this._zeebeApi = zeebeApi;
    this._onAction = onAction;
    this._tab = tab;
  }

  getApi() {
    return {
      deploy: this.deploy.bind(this),
      startInstance: this.startInstance.bind(this),
      getProcessInstance: this.getProcessInstance.bind(this),
      getProcessInstanceVariables: this.getProcessInstanceVariables.bind(this),
      getProcessInstanceElementInstances: this.getProcessInstanceElementInstances.bind(this),
      getProcessInstanceIncident: this.getProcessInstanceIncident.bind(this),
      getWaitingState: this.getWaitingState.bind(this)
    };
  }

  async getDeploymentConfig() {

    if (!this._tab) {
      return {};
    }

    const connection = await this._deployment.getConnectionForTab(this._tab);
    return {
      endpoint: connection,
      context: 'taskTesting'
    };
  }

  async getOperateUrl() {
    const { endpoint } = await this.getDeploymentConfig();

    if (!endpoint) {
      return;
    }

    if (endpoint.targetType === 'camundaCloud') {
      const { href } = getOperateUrl(endpoint) || {};
      return href;
    }

    if (endpoint.targetType === 'selfHosted') {
      const { operateUrl } = endpoint;
      return operateUrl;
    }
  }

  async deploy() {
    const config = await this.getDeploymentConfig();

    const saved = await this._onAction('save');

    if (!saved) {
      return {
        success: false,
        error: 'Failed to save the file before deployment'
      };
    }

    this._deployment.once('deployed', (event) => {
      this._handleDeployment(event);
    });

    const result = await this._deployment.deploy([
      {
        path: saved.file.path,
        type: 'bpmn'
      }
    ], config);

    if (!result.success) {
      log('Deployment failed: ', result);
      return {
        success: false,
        error: result?.response?.message || 'Deployment failed'
      };
    }

    log('Deployment successful: ', result);
    return result;
  }

  async startInstance(processDefinitionKey, elementId, variables) {
    const config = await this.getDeploymentConfig();

    const response = await this._startInstance.startInstance({
      ...config,
      processDefinitionKey,
      variables,
      startInstructions:[
        {
          elementId
        }
      ],
      runtimeInstructions: [
        {
          type: 'TERMINATE_PROCESS_INSTANCE',
          afterElementId: elementId
        }
      ]
    });

    log('Start instance successful: ', response);
    return response;
  }

  async getProcessInstance(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.searchProcessInstances(config, processInstanceKey);
  }

  async getProcessInstanceVariables(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.searchVariables(config, processInstanceKey);
  }

  async getProcessInstanceElementInstances(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.searchElementInstances(config, processInstanceKey);
  }

  async getProcessInstanceIncident(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.searchIncidents(config, processInstanceKey);
  }

  async getWaitingState(processInstanceKey, elementId) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.getWaitingState(config, processInstanceKey, elementId);
  }

  _handleDeployment({ context, deploymentResult, endpoint }) {

    if (deploymentResult.success) {
      this._onAction('emit-event', {
        type: 'deployment.done',
        payload: {
          context,
          targetType: endpoint?.targetType,
        }
      });
    } else {
      this._onAction('emit-event', {
        type: 'deployment.error',
        payload: {
          context,
          error: deploymentResult?.response,
          targetType: endpoint?.targetType,
        }
      });
    }
  }
}
