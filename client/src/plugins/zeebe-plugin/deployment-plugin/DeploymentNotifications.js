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

import {
  getDeploymentUrls,
  getResourceType,
  RESOURCE_TYPES
} from '../shared/util';

import * as css from './DeploymentNotifications.less';

/**
 * Get success notification for deployment.
 *
 * @param {Object} tab
 * @param {DeploymentConfig} config
 * @param {DeploymentResult} deploymentResult
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, deploymentResult) {
  const resourceType = getResourceType(tab);

  let title = null;

  if (resourceType === RESOURCE_TYPES.BPMN) {
    title = 'Process definition deployed';
  } else if (resourceType === RESOURCE_TYPES.DMN) {
    title = 'Decision requirements definition deployed';
  } else if (resourceType === RESOURCE_TYPES.FORM) {
    title = 'Form definition deployed';
  } else if (resourceType === RESOURCE_TYPES.RPA) {
    title = 'RPA script deployed';
  }

  const urls = getDeploymentUrls(tab, config, deploymentResult);

  const content = (
    <div className={ css.DeploymentNotification }>
      <div>
        <code>{ tab.file.name }</code> deployed.
      </div>
      {
        urls.length
          ? urls.length === 1
            ? <a href={ urls[0].url }>Open in Camunda Operate</a>
            : (
              <>
                <div>Deployments for this file:</div>
                <ul className="dashed">
                  { urls.map(({ decisionId, processId, url }) => {
                    return (
                      <li key={ url }>
                        {
                          decisionId && <>Decision <code>{ decisionId }</code> </>
                        }
                        {
                          processId && <>Process <code>{ processId }</code> </>
                        }
                        <a href={ url }>Open in Camunda Operate</a>
                      </li>
                    );
                  }) }
                </ul>
              </>
            )
          : null
      }
    </div>
  );

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
      See the log for further details
    </button>
  );

  return {
    type: 'error',
    title: 'Deployment failed',
    content,
    duration: 4000
  };
}