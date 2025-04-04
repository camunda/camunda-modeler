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
 * @typedef {import('./types').DeploymentResult} DeploymentResult
 */

import React from 'react';

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

import {
  getOperateUrl,
  getProcessId,
  getProcessVersion,
  getResourceType,
  RESOURCE_TYPES
} from '../shared/util';

import * as css from './DeploymentNotifications.less';

/**
 * Get success notification for deployment.
 *
 * @param {{ type: string }} tab
 * @param {DeploymentConfig} config
 * @param {DeploymentResult} deploymentResult
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, deploymentResult) {
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

  const { endpoint } = config;

  const processId = getProcessId(deploymentResult.response),
        version = getProcessVersion(deploymentResult.response) || 'all';

  let content = null;

  if (endpoint.targetType === TARGET_TYPES.CAMUNDA_CLOUD && processId) {
    const operateUrl = getOperateUrl(endpoint);

    if (operateUrl) {
      const processesUrl = new URL(`${operateUrl}/processes`);

      processesUrl.searchParams.set('process', processId);
      processesUrl.searchParams.set('version', version);
      processesUrl.searchParams.set('active', 'true');
      processesUrl.searchParams.set('incidents', 'true');

      content = (
        <div className={ css.DeploymentNotification }>
          <div>
            <code>{ tab.file.name }</code> deployed with ID <code>{ processId }</code> and version <code>{ version }</code>.
          </div>
          <a href={ processesUrl.toString() }>
            Open in Camunda Operate
          </a>
        </div>
      );
    }
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