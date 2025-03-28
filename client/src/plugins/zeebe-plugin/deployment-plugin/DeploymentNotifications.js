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
 * @typedef {import('./types').DeploymentConfig} DeploymentConfig
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').DeployResourceResponse} DeployResourceResponse
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').ProcessDeployment } ProcessDeployment
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').DecisionDeployment } DecisionDeployment
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').FormDeployment } FormDeployment
 */

import React from 'react';

import * as TARGET_TYPES from '../shared/ZeebeTargetTypes';

import {
  getClusterUrl,
  getProcessId,
  getProcessVersion,
  getResourceType
} from '../shared/util';

import * as css from './DeploymentNotifications.less';

/**
 * Get success notification for deployment.
 *
 * @param {{ type: string }} tab
 * @param {DeploymentConfig} config
 * @param {DeployResourceResponse<ProcessDeployment>|DeployResourceResponse<DecisionDeployment>|DeployResourceResponse<FormDeployment>} deploymentResponse
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, deploymentResponse) {
  const resourceType = getResourceType(tab);

  let title;

  if (resourceType === RESOURCE_TYPES.BPMN) {
    title = 'Process definition deployed';
  } else if (resourceType === RESOURCE_TYPES.DMN) {
    title = 'Decision definition deployed';
  } else if (resourceType === RESOURCE_TYPES.FORM) {
    title = 'Form definition deployed';
  } else if (resourceType === RESOURCE_TYPES.RPA) {
    title = 'RPA Script deployed';
  }

  const processId = getProcessId(deploymentResponse);

  if (!processId) {
    return null;
  }

  const { endpoint } = config;

  const clusterUrl = getClusterUrl(endpoint, deploymentResponse);

  const processesUrl = new URL(`${clusterUrl}/processes`);

  processesUrl.searchParams.set('process', processId);
  processesUrl.searchParams.set('version', getProcessVersion(deploymentResponse) || 'all');
  processesUrl.searchParams.set('active', 'true');
  processesUrl.searchParams.set('incidents', 'true');

  let content = null;

  if (endpoint.targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
    content = (
      <div className={ css.DeploymentNotification }>
        <div>
          Process Definition ID:
          <code>{processId}</code>
        </div>
        <a href={ processesUrl.toString() }>
          Open in Camunda Operate
        </a>
      </div>
    );
  }

  return {
    type: 'success',
    title,
    content,
    duration: 8000
  };
}

/**
 * Get error notification for deployment.
 *
 * @param {Function} triggerAction
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number }}
 */
export function getErrorNotification(triggerAction) {
  const content = (
    <button
      onClick={ () => triggerAction('open-log') }>
      See the log for further details.
    </button>
  );

  return {
    type: 'error',
    title: 'Deployment failed',
    content,
    duration: 4000
  };
}