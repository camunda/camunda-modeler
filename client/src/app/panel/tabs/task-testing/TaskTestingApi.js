/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Deployment from '../../../../plugins/zeebe-plugin/deployment-plugin/Deployment';
import StartInstance from '../../../../plugins/zeebe-plugin/start-instance-plugin/StartInstance';

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
    return this.deploymentPlugin.getConfigForFile(this.file);
  }

  async deploy() {
    this.onAction('save');

    const config = await this.deploymentPlugin.getConfigForFile(this.file);

    const result = await this.deploymentPlugin.deploy([
      {
        path: this.file.path,
        type: 'bpmn'
      }
    ], config);

    if (!result.success) {
      return {
        success: false,
        error: result?.response?.message || 'Deployment failed'
      };
    }

    return result;
  }

  async startInstance(processId, elementId, variables) {
    const config = await this.deploymentPlugin.getConfigForFile(this.file);

    return this.startInstancePlugin.startInstance(processId, {
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
  }

  async getProcessInstance(processInstanceKey) {
    const config = await this.deploymentPlugin.getConfigForFile(this.file);

    return this.zeebeApi.searchProcessInstances(config, processInstanceKey);
  }

  async getProcessInstanceVariables(processInstanceKey) {
    const config = await this.deploymentPlugin.getConfigForFile(this.file);

    return this.zeebeApi.searchVariables(config, processInstanceKey);
  }

  async getProcessInstanceIncident(processInstanceKey) {
    const config = await this.deploymentPlugin.getConfigForFile(this.file);

    return this.zeebeApi.searchIncidents(config, processInstanceKey);
  }
}