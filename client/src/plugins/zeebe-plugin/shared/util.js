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
 */

/**
 * Get URL for Camunda Operate cluster.
 *
 * @param {Endpoint} endpoint
 *
 * @returns {URL}
 */
export function getClusterUrl(endpoint) {
  const {
    camundaCloudClusterId,
    camundaCloudClusterRegion
  } = endpoint;

  const url = new URL(`https://${camundaCloudClusterRegion}.operate.camunda.io/${camundaCloudClusterId}`);

  return url;
}

function getProcess(deploymentResponse) {
  return deploymentResponse?.deployments?.[0]?.process || null;
}

export function getProcessId(response) {
  return getProcess(response)?.bpmnProcessId || null;
}

export function getProcessVersion(response) {
  return getProcess(response)?.version || null;
}

const RESOURCE_TYPES = {
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