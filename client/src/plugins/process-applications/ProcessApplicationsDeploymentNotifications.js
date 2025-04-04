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
 * @typedef {import('../zeebe-plugin/deployment-plugin/types').DeploymentConfig} DeploymentConfig
 * @typedef {import('../zeebe-plugin/deployment-plugin/types').DeploymentResult} DeploymentResult
 * @typedef {import('../zeebe-plugin/deployment-plugin/types').ResourceConfig} ResourceConfig
 */

import React from 'react';

import { getOperateUrl } from '../zeebe-plugin/shared/util';

import { TARGET_TYPES } from '../../remote/ZeebeAPI';

import * as css from './ProcessApplicationsDeploymentNotifications.less';

/**
 * Get success notification for deployment.
 *
 * @param {{ type: string }} tab
 * @param {DeploymentConfig} config
 * @param {DeploymentResult} deploymentResult
 * @param {Array<ResourceConfig>} resourceConfigs
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, deploymentResult, resourceConfigs) {
  const content = getContent(tab, config, deploymentResult);

  return {
    type: 'success',
    title: 'Process application deployed',
    content: (
      <div className={ css.ProcessApplicationsDeploymentNotification }>
        <div>
          { resourceConfigs.length } files deployed
        </div>
        { content }
      </div>
    ),
    duration: 800000
  };
}

export function getProcessId(deployment) {
  return deployment.process?.bpmnProcessId || null;
}

export function getProcessVersion(deployment) {
  return deployment.process?.processVersion || null;
}

export function getDecisionId(deployment) {
  return deployment.decision?.dmnDecisionId || null;
}

export function getDecisionVersion(deployment) {
  return deployment.decision?.version || null;
}

export function getFormId(deployment) {
  return deployment.form?.formId || null;
}

export function getFormVersion(deployment) {
  return deployment.form?.version || null;
}

function getContent(tab, config, deploymentResult) {
  const { endpoint } = config;

  if (endpoint.targetType !== TARGET_TYPES.CAMUNDA_CLOUD) {
    return null;
  }

  const operateUrl = getOperateUrl(endpoint);

  const { response } = deploymentResult;

  const { deployments } = response;

  const links = deployments.reduce((links, deployment) => {
    const deploymentType = getDeploymentType(deployment);

    if (deploymentType === 'process') {
      const processesUrl = new URL(`${ operateUrl }/processes`);

      const processId = getProcessId(deployment),
            version = getProcessVersion(deployment) || 'all';

      processesUrl.searchParams.set('process', processId);
      processesUrl.searchParams.set('version', version);
      processesUrl.searchParams.set('active', 'true');
      processesUrl.searchParams.set('incidents', 'true');

      return [
        ...links,
        {
          id: processId,
          version,
          url: processesUrl
        }
      ];
    } else if (deploymentType === 'decision') {
      const decisionsUrl = new URL(`${ operateUrl }/decisions`);

      const decisionId = getDecisionId(deployment),
            version = getDecisionVersion(deployment) || 'all';

      decisionsUrl.searchParams.set('name', decisionId);
      decisionsUrl.searchParams.set('version', version);

      return [
        ...links,
        {
          id: decisionId,
          version,
          url: decisionsUrl
        }
      ];
    } else if (deploymentType === 'form') {
      const formId = getFormId(deployment),
            version = getFormVersion(deployment) || 'all';

      return [
        ...links,
        {
          id: formId,
          version
        }
      ];
    }

    return links;
  }, []);

  if (!links.length) {
    return null;
  }

  return (
    <div className={ css.ProcessApplicationsDeploymentNotification }>
      <ul className="dashed">
        { links.map(link => {
          return (
            <li key={ link.id }>
              <div>
                <code>{ tab.file.name }</code> with ID <code>{ link.id }</code> and version <code>{ link.version }</code>.
              </div>
              {
                link.url
                  ? (
                    <a href={ link.url.toString() }>
                      Open in Camunda Operate
                    </a>
                  )
                  : null
              }
            </li>
          );
        }) }
      </ul>
    </div>
  );
}

function getDeploymentType(deployment) {
  if (deployment.process) {
    return 'process';
  } else if (deployment.decision) {
    return 'decision';
  } else if (deployment.form) {
    return 'form';
  }

  return null;
}