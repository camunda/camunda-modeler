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

import Deployment from '../../../../plugins/zeebe-plugin/deployment-plugin/Deployment';
import StartInstance from '../../../../plugins/zeebe-plugin/start-instance-plugin/StartInstance';

import { getOperateUrl } from '../../../../plugins/zeebe-plugin/shared/util';

const log = debug('TaskTestingApi');

export default class TaskTestingApi {
  constructor(zeebeApi, config, file, onAction) {
    this.zeebeApi = zeebeApi;
    this.deploymentPlugin = new Deployment(config, zeebeApi);
    this.startInstancePlugin = new StartInstance(config, zeebeApi);
    this.onAction = onAction;
    this.file = file;
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
    const config = await this.deploymentPlugin.getConfigForFile(this.file);
    return {
      ...config,
      context: 'taskTesting'
    };
  }

  async getOperateUrl() {
    const { endpoint } = await this.getDeploymentConfig();

    if (endpoint.targetType === 'camundaCloud') {
      const { href } = getOperateUrl(endpoint);
      return href;
    }

    if (endpoint.targetType === 'selfHosted') {
      const { operateUrl } = endpoint;
      return operateUrl;
    }
  }

  async deploy() {
    this.onAction('save');

    const config = await this.getDeploymentConfig();

    const result = await this.deploymentPlugin.deploy([
      {
        path: this.file.path,
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

    // Detect gRPC connection by the response shape. We expect REST.
    if (!result.response.processes) {
      log('Deployment failed (gRPC): ', result);
      return {
        success: false,
        error: 'gRPC connection is not supported, use REST.'
      };
    }

    log('Deployment successful: ', result);
    return result;
  }

  async startInstance(processId, elementId, variables) {
    const config = await this.getDeploymentConfig();

    const response = await this.startInstancePlugin.startInstance(processId, {
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

    return this.zeebeApi.searchProcessInstances(config, processInstanceKey);
  }

  async getProcessInstanceVariables(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this.zeebeApi.searchVariables(config, processInstanceKey);
  }

  async getProcessInstanceIncident(processInstanceKey) {
    const config = await this.getDeploymentConfig();

    return this.zeebeApi.searchIncidents(config, processInstanceKey);
  }
}