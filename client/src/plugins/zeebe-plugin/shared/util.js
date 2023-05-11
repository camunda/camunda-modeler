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
 * Get a link to instances in Operate.
 *
 * @param {Endpoint} endpoint
 */
export function getCloudLink(endpoint) {
  const {
    camundaCloudClusterId,
    camundaCloudClusterRegion
  } = endpoint;

  const url = new URL(`https://${camundaCloudClusterRegion}.operate.camunda.io/${camundaCloudClusterId}/instances`);

  return url;
}

export function getProcessId(response) {
  return response.processes && response.processes[0] && response.processes[0].bpmnProcessId || null;
}
