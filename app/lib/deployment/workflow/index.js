/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const { app } = require('electron');
let FormData = require('form-data');
const fetch = require('node-fetch');

const log = require('../../log')('app:deployment');

const deploymentConfig = require('../DeploymentConfig');

/**
 * Get the endpoint of the configured Camunda engine to deploy to
 *
 * @return {string} the currently specified endpoint of the Camunda engine
 */
module.exports.getCamundaEndpoint = function() {
  if (deploymentConfig.camundaEndpoint === undefined) {
    return '';
  }
  return deploymentConfig.camundaEndpoint;
};

/**
 * Set the endpoint of the Camunda engine to deploy to
 *
 * @param camundaEndpoint the endpoint of the Camunda engine
 */
module.exports.setCamundaEndpoint = function(camundaEndpoint) {
  if (camundaEndpoint !== null && camundaEndpoint !== undefined) {
    deploymentConfig.camundaEndpoint = camundaEndpoint.replace(/\/$/, '');
    app.emit('menu:action', 'camundaEndpointChanged', deploymentConfig.camundaEndpoint);
  }
};

/**
 * Deploy the given workflow to the connected Camunda engine
 *
 * @param workflowName the name of the workflow file to deploy
 * @param workflowXml the workflow in xml format
 * @return {Promise<{status: string}>} a promise with the deployment status as well as the endpoint of the deployed workflow if successful
 */
module.exports.deployWorkflow = async function(workflowName, workflowXml) {
  log.info('Deploying workflow to Camunda Engine at endpoint: %s', deploymentConfig.camundaEndpoint);

  // add required form data fields
  const form = new FormData({});
  form.append('deployment-name', workflowName);
  form.append('deployment-source', 'QuantME Modeler');
  form.append('deploy-changed-only', 'true');

  // add bpmn file ending if not present
  let fileName = workflowName;
  if (!fileName.endsWith('.bpmn')) {
    fileName = fileName + '.bpmn';
  }

  // add diagram to the body
  form.append('file', workflowXml, {
    filename: fileName,
    contentType: 'text/xml'
  });

  // make the request and wait for deployed endpoint
  try {
    const response = await fetch(deploymentConfig.camundaEndpoint + '/deployment/create', {
      method: 'POST',
      body: form
    });

    if (response.ok) {

      // retrieve deployment results from response
      const {
        id,
        deployedProcessDefinitions
      } = await response.json();
      log.info('Deployment successful with deployment id: %s', id);

      // abort if there is not exactly one deployed process deifnition
      if (Object.values(deployedProcessDefinitions || {}).length !== 1) {
        log.error('Invalid size of deployed process definitions list: ' + Object.values(deployedProcessDefinitions || {}).length);
        return { status: 'failed' };
      }

      return { status: 'deployed', deployedProcessDefinition: Object.values(deployedProcessDefinitions || {})[0] };
    } else {
      log.error('Deployment of workflow returned invalid status code: %s', response.status);
      return { status: 'failed' };
    }
  } catch (error) {
    log.error('Error while executing post to deploy workflow: ' + error);
    return { status: 'failed' };
  }
};
