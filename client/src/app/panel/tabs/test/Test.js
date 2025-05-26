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
  bootstrapDeployment,
  bootstrapStartInstance,
  getProcessId
} from '../../../../plugins/zeebe-plugin/shared/util';

import ZeebeAPI from '../../../../remote/ZeebeAPI';

export default class Test {
  constructor(backend, config, injector, file) {
    const { connectionChecker, deployment } = bootstrapDeployment(backend, config);

    this._deployment = deployment;

    const { startInstance } = bootstrapStartInstance(backend, config);

    this._startInstance = startInstance;

    this._zeebeAPI = new ZeebeAPI(backend);

    this._injector = injector;
    this._file = file;

  }

  async run(elementId, variables, callback) {
    const file = this._file;

    const deploymentConfig = await this._deployment.getConfigForFile(file);

    const deploymentResponse = await this._deployment.deploy({
      path: file.path,
      type: 'bpmn',
    }, deploymentConfig);

    if (!deploymentResponse.success) {
      console.log('Deployment error', deploymentResponse.response.details || deploymentResponse.response.message);

      return deploymentResponse;
    }

    if (deploymentResponse.success) {
      const processId = getProcessId(deploymentResponse, file.name);

      if (!processId) {
        console.log('No process id found');

        return;
      }

      const startInstanceConfig = await this._startInstance.getConfigForFile(file);

      const startInstanceResult = await this._startInstance.startInstance(processId, {
        ...deploymentConfig,
        variables,
        startInstructions:[
          {
            elementId
          }
        ],
        withResult: false // withResult does not support start instructions
      });

      if (startInstanceResult.success) {
        console.log('Start instance result', startInstanceResult.response);

        const { processInstanceKey } = startInstanceResult.response;

        const intervalCallback = async () => {
          const getProcessInstanceResult = await this._zeebeAPI.getProcessInstance(deploymentConfig.endpoint, processInstanceKey);

          if (!getProcessInstanceResult.success) {
            console.error('Get process instance error', getProcessInstanceResult);

            callback({
              type: 'instanceNotFound',
              response: getProcessInstanceResult
            });
          } else {
            console.log('Process instance', getProcessInstanceResult);

            callback({
              type: 'instanceFound',
              response: getProcessInstanceResult
            });

            clearInterval(interval);
          }
        };

        const interval = setInterval(intervalCallback, 1000);

        return {
          type: 'instanceStarted',
          response: startInstanceResult
        };
      } else {
        console.log('Start instance error', startInstanceResult.response.details || startInstanceResult.response.message);
      }
    }
  }

  async getInput() {
    const file = this._file;

    const startInstanceConfig = await this._startInstance.getConfigForFile(file);

    const { variables } = startInstanceConfig;

    return variables;
  }
}