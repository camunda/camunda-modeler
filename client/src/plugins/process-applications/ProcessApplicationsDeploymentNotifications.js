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

import { getDeploymentUrls } from '../../app/zeebe/util';

import * as css from './ProcessApplicationsDeploymentNotifications.less';

/**
 * Get success notification for deployment.
 *
 * @param {Object} tab
 * @param {DeploymentConfig} config
 * @param {DeploymentResult} deploymentResult
 * @param {Array<ResourceConfig>} resourceConfigs
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, deploymentResult, resourceConfigs) {
  const urls = getDeploymentUrls(tab, config, deploymentResult);

  return {
    type: 'success',
    title: 'Process application deployed',
    content: (
      <div className={ css.ProcessApplicationsDeploymentNotification }>
        <div>
          <code>{ tab.file.name }</code> and { resourceConfigs.length - 1} additional { resourceConfigs.length - 1 === 1 ? 'file' : 'files' } deployed.
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
    ),
    duration: 8000
  };
}