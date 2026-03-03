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
 * @typedef {import('../deployment-plugin/types').DeploymentConfig} DeploymentConfig
 * @typedef {import('./types').StartInstanceResult} StartInstanceResult
 * @typedef {import('../zeebe-plugin/deployment-plugin/types').ResourceConfig} ResourceConfig
 */

import React from 'react';

import { getStartInstanceUrl } from '../../app/zeebe/util';

import * as css from './ProcessApplicationsStartInstanceNotifications.less';

/**
 * Get success notification for instance started.
 *
 * @param {Object} tab
 * @param {DeploymentConfig} config
 * @param {StartInstanceResult} startInstanceResult
 * @param {Array<ResourceConfig>} resourceConfigs
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, startInstanceResult, resourceConfigs) {
  const url = getStartInstanceUrl(config, startInstanceResult);

  const content = (
    <div className={ css.ProcessApplicationsStartInstanceNotification }>
      <div>
        <code>{ tab.file.name }</code> and { resourceConfigs.length } additional files deployed and process instance started.
      </div>
      {
        url && (
          <a href={ url }>
            Open in Camunda Operate
          </a>
        )
      }
    </div>
  );

  return {
    type: 'success',
    title: 'Process instance started',
    content,
    duration: 8000
  };
}