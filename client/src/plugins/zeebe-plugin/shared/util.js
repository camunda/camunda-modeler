/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * @typedef {import('../deployment-plugin/types').Endpoint} Endpoint
 * @typedef {import('../deployment-plugin/types').DeploymentResponse} DeploymentResponse
 * @typedef {import('../start-instance-plugin/types').StartInstanceResponse} StartInstanceResponse
 */

import ConnectionChecker from '../deployment-plugin/ConnectionChecker';
import Deployment from '../deployment-plugin/Deployment';
import DeploymentConfigValidator from '../deployment-plugin/DeploymentConfigValidator';

import StartInstance from '../start-instance-plugin/StartInstance';
import StartInstanceConfigValidator from '../start-instance-plugin/StartInstanceConfigValidator';

import ZeebeAPI from '../../../remote/ZeebeAPI';

/**
 * Get Camunda Operate URL.
 *
 * @param {Endpoint} endpoint
 *
 * @returns {URL|null}
 */
export function getOperateUrl(endpoint) {
  const { camundaCloudClusterUrl } = endpoint;

  const clusterId = getClusterId(camundaCloudClusterUrl),
        clusterRegion = getClusterRegion(camundaCloudClusterUrl);

  if (!clusterId || !clusterRegion) {
    return null;
  }

  return new URL(`https://${ clusterRegion }.operate.camunda.io/${ clusterId }`);
}

/**
  * Get cluster ID from cluster URL.
  *
  * @example
  *
  * ```javascript
  * const clusterId = getClusterId('https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443');
  *
  * console.log(clusterId); // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  * ```
  *
  * @param  {string} clusterURL
  *
  * @returns {string} clusterId
  */
function getClusterId(clusterURL) {
  const matches = clusterURL.match(/([a-z\d]+-){2,}[a-z\d]+/g);

  return matches ? matches[0] : null;
}


/**
 * Get cluster region from cluster URL.
 *
 * @example
 *
 * ```javascript
 * const clusterRegion = getClusterRegion('https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443');
 *
 * console.log(clusterRegion); // 'yyy-1'
 * ```
 *
 * @param  {string} clusterURL
 *
 * @returns {string} clusterRegion
 */
function getClusterRegion(clusterURL) {
  const matches = clusterURL.match(/(?<=\.)[a-z]+-[\d]+/g);

  return matches ? matches[0] : null;
}

/**
 * Get process from deployment response.
 *
 * @param {DeploymentResponse} deploymentResponse
 *
 * @returns {Object|null}
 */
function getProcess(deploymentResponse) {
  return deploymentResponse?.deployments?.[0]?.process || null;
}

/**
 * Get process ID from deployment response.
 *
 * @param {DeploymentResponse} deploymentResponse
 *
 * @returns {string|null}
 */
export function getProcessId(response) {
  return getProcess(response)?.bpmnProcessId || null;
}

/**
 * Get process version from deployment response.
 *
 * @param {DeploymentResponse} deploymentResponse
 *
 * @returns {string|null}
 */
export function getProcessVersion(response) {
  return getProcess(response)?.version || null;
}

/**
 * Get process instance key from start instance response.
 *
 * @param {StartInstanceResponse} response
 *
 * @returns {string|null}
 */
export function getProcessInstanceKey(response) {
  return response?.processInstanceKey || null;
}

export const RESOURCE_TYPES = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  FORM: 'form',
  RPA: 'rpa'
};

/*
  * Get resource type from tab.
  *
  * @param {{ type: string }} tab
  *
  * @returns {string|null}
  */
export function getResourceType({ type }) {
  if (type === 'cloud-bpmn') {
    return RESOURCE_TYPES.BPMN;
  }

  if (type === 'cloud-dmn') {
    return RESOURCE_TYPES.DMN;
  }

  if (type === 'cloud-form') {
    return RESOURCE_TYPES.FORM;
  }

  if (type === 'rpa') {
    return RESOURCE_TYPES.RPA;
  }

  return null;
}

export function bootstrapDeployment(backend, config) {
  const zeebeAPI = new ZeebeAPI(backend);

  const deployment = new Deployment(config, zeebeAPI);

  const connectionChecker = new ConnectionChecker(zeebeAPI);

  return {
    connectionChecker,
    deployment,
    deploymentConfigValidator: DeploymentConfigValidator
  };
}

export function bootstrapStartInstance(backend, config) {
  const zeebeAPI = new ZeebeAPI(backend);

  const startInstance = new StartInstance(config, zeebeAPI);

  return {
    startInstance,
    startInstanceConfigValidator: StartInstanceConfigValidator
  };
}