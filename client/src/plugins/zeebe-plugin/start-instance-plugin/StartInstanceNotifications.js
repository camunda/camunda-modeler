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
 */

import React from 'react';

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

import {
  getOperateUrl,
  getProcessInstanceKey
} from '../shared/util';

import * as css from './StartInstanceNotifications.less';

/**
 * Get success notification for instance started.
 *
 * @param {{ type: string }} tab
 * @param {DeploymentConfig} config
 * @param {StartInstanceResult} startInstanceResult
 *
 * @returns {{ type: string, title: string, content: React.ReactNode, duration: number } | null}
 */
export function getSuccessNotification(tab, config, startInstanceResult) {
  const { endpoint } = config;

  const processInstanceKey = getProcessInstanceKey(startInstanceResult.response);

  let content = null;

  if (endpoint.targetType === TARGET_TYPES.CAMUNDA_CLOUD && processInstanceKey) {
    const operateUrl = getOperateUrl(endpoint);

    if (operateUrl) {
      const processesUrl = new URL(`${operateUrl}/processes/${processInstanceKey}`);

      content = (
        <div className={ css.StartInstanceNotification }>
          <div>
            <code>{ tab.file.name }</code> deployed and process instance started with key <code>{ processInstanceKey }</code>.
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
    title: 'Process instance started',
    content,
    duration: 8000
  };
}

/**
 * Get error notification for instance started.
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
    title: 'Process instance not started',
    content,
    duration: 4000
  };
}