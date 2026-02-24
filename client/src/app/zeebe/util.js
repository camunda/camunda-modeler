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
 * @typedef {import('./Deployment').Endpoint} Endpoint
 */

/**
 * Get Camunda Operate URL.
 *
 * @param {Endpoint} endpoint
 *
 * @returns {URL|null}
 */
export function getOperateUrl(endpoint) {

  // use explicit Operate URL if provided (e.g. self-managed)
  if (endpoint.operateUrl) {
    return new URL(endpoint.operateUrl);
  }

  // build Operate URL from cluster URL (SaaS)
  const { camundaCloudClusterUrl } = endpoint;

  if (!camundaCloudClusterUrl) {
    return null;
  }

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
  * Supported formats:
  *
  * https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443
  * https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
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
 * Supported formats:
 *
 * https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443
 * https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
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
  const matches = clusterURL.match(/(?:(?<=\.)|(?<=:\/\/))[a-z]+-\d+(?=\.)/g);

  return matches ? matches[0] : null;
}

export const DEPLOYMENT_TYPES = {
  PROCESS: 'process',
  DECISION: 'decision',
  DECISION_REQUIREMENTS: 'decisionRequirements',
  FORM: 'form'
};

function getDeploymentType(deployment) {
  if (deployment.process || deployment.processDefinition) {
    return DEPLOYMENT_TYPES.PROCESS;
  } else if (deployment.decision || deployment.decisionDefinition) {
    return DEPLOYMENT_TYPES.DECISION;
  } else if (deployment.decisionRequirements) {
    return DEPLOYMENT_TYPES.DECISION_REQUIREMENTS;
  } else if (deployment.form) {
    return DEPLOYMENT_TYPES.FORM;
  }

  // TODO: RPA can be deployed but Zeebe does not return anything as part of DeployResourceResponse
  // see https://docs.camunda.io/docs/apis-tools/zeebe-api/gateway-service/#output-deployresourceresponse

  return null;
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

/**
 * Get Camunda Operate URL(s) for deployment.
 *
 * @param {Object} tab
 * @param {Object} config
 * @param {Object} deploymentResult
 *
 * @returns {{
 *   url: string,
 *   processId?: string,
 *   decisionId?: string,
 * }[]}
 */
export function getDeploymentUrls(tab, config, deploymentResult) {
  const { file } = tab;

  const { endpoint } = config;

  const operateUrl = getOperateUrl(endpoint);

  if (!operateUrl) {
    return [];
  }

  const { response } = deploymentResult,
        { deployments } = response;

  const resourceType = getResourceType(tab);

  if (resourceType === RESOURCE_TYPES.BPMN) {
    const deployment = deployments.find(deployment => {
      const deploymentType = getDeploymentType(deployment);

      return deploymentType === DEPLOYMENT_TYPES.PROCESS && deployment.process.resourceName === file.name;
    });

    const {
      bpmnProcessId,
      version
    } = deployment.process;

    const url = new URL(`${ operateUrl }/processes`);

    url.searchParams.set('process', bpmnProcessId);
    url.searchParams.set('version', version);
    url.searchParams.set('active', 'true');
    url.searchParams.set('incidents', 'true');

    return [ {
      processId: bpmnProcessId,
      url: url.toString()
    } ];
  } else if (resourceType === RESOURCE_TYPES.DMN) {
    const decisionRequirementsDeployment = deployments.find(deployment => {
      const deploymentType = getDeploymentType(deployment);

      return deploymentType === DEPLOYMENT_TYPES.DECISION_REQUIREMENTS && deployment.decisionRequirements.resourceName === file.name;
    });

    const decisionDeployments = deployments.filter(deployment => {
      const deploymentType = getDeploymentType(deployment);

      return deploymentType === DEPLOYMENT_TYPES.DECISION
        && deployment.decision.decisionRequirementsKey === decisionRequirementsDeployment.decisionRequirements.decisionRequirementsKey;
    });

    return decisionDeployments.map(deployment => {
      const {
        dmnDecisionId,
        version
      } = deployment.decision;

      const url = new URL(`${ operateUrl }/decisions`);

      url.searchParams.set('name', dmnDecisionId);
      url.searchParams.set('version', version);

      return {
        decisionId: dmnDecisionId,
        url: url.toString()
      };
    });
  }

  return [];
}

/**
 * Get Camunda Operate URL for instance started.
 *
 * @param {Object} config
 * @param {Object} startInstanceResult
 *
 * @returns {string|null}
 */
export function getStartInstanceUrl(config, startInstanceResult) {
  const { endpoint } = config;

  const operateUrl = getOperateUrl(endpoint);

  if (!operateUrl) {
    return null;
  }

  const { response } = startInstanceResult;

  const { processInstanceKey } = response;

  return new URL(`${operateUrl}/processes/${processInstanceKey}`).toString();
}

/**
 * Get process ID from deployment result.
 *
 * @param {Object} deploymentResult
 * @param {string} resourceName
 *
 * @returns {string|null}
 */
export function getProcessId(deploymentResult, resourceName) {
  const { response } = deploymentResult;

  const { deployments } = response;

  const deployment = deployments.find(deployment => {
    const deploymentType = getDeploymentType(deployment);

    return deploymentType === DEPLOYMENT_TYPES.PROCESS && deployment.process.resourceName === resourceName;
  });

  if (!deployment) {
    return null;
  }

  const { bpmnProcessId } = deployment.process;

  return bpmnProcessId;
}
