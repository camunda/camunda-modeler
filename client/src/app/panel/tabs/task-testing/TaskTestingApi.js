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
  constructor(deployment, startInstance, zeebeApi, file, onAction) {
    this._deployment = deployment;
    this._startInstance = startInstance;
    this._zeebeApi = zeebeApi;
    this._onAction = onAction;
    this._file = file;
  }

  getApi() {
    return {
      deploy: this.deploy.bind(this),
      startInstance: this.startInstance.bind(this),
      getProcessInstance: this.getProcessInstance.bind(this),
      getProcessInstanceVariables: this.getProcessInstanceVariables.bind(this),
      getProcessInstanceIncident: this.getProcessInstanceIncident.bind(this)
    };
  }

  async getDeploymentConfig() {

    if (!this._file?.path) {
      return {};
    }

    const config = await this._deployment.getConfigForFile(this._file);
    return {
      ...config,
      context: 'taskTesting'
    };
  }

  async getOperateUrl() {
    const { endpoint } = await this.getDeploymentConfig();

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

    const saved = await this._onAction('save');

    if (!saved) {
      return {
        success: false,
        error: 'Failed to save the file before deployment'
      };
    }

    const config = await this.getDeploymentConfig();

    const result = await this._deployment.deploy([
      {
        path: this._file.path,
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

  async startInstance(processId, elementId, variables) {
    const config = await this.getDeploymentConfig();

    const response = await this._startInstance.startInstance(processId, {
      ...config,
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

  async getProcessInstanceIncident(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this._zeebeApi.searchIncidents(config, processInstanceKey);
  }
}