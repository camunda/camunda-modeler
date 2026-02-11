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
 * @typedef {import('./types').ConnectionCheckResult} ConnectionCheckResult
 */

import React, { useEffect } from 'react';

import { Overlay } from '../../../shared/ui';

import { default as DefaultDeploymentConfigForm } from './DeploymentConfigForm';


import {
  getSuccessNotification as defaultGetSuccessNotification,
  getErrorNotification as defaultGetErrorNotification
} from './DeploymentNotifications';


import { getGRPCErrorCode, getResourceType } from '../shared/util';

import { ENGINES } from '../../../util/Engines';

import * as css from './DeploymentPluginOverlay.less';

/**
 * @typedef {Object} DeploymentPluginOverlayProps
 * @property {Object} activeTab - The currently active tab
 * @property {HTMLElement} anchor - The anchor element for positioning the overlay
 * @property {Object} connectionCheckResult - Result of the connection check
 * @property {import('../../../app/zeebe/ConnectionManager').default} connectionManager - The connection manager instance
 * @property {import('../../../app/zeebe/Deployment').default} deployment - The deployment instance
 * @property {Function} displayNotification - Function to display notifications
 * @property {React.ComponentType} [DeploymentConfigForm] - Custom deployment configuration form component
 * @property {Function} [getErrorNotification] - Function to generate error notifications
 * @property {Function} [getResourceConfigs] - Function to get resource configurations
 * @property {Function} [getSuccessNotification] - Function to generate success notifications
 * @property {Function} log - Logging function
 * @property {Function} onClose - Callback function when overlay is closed
 * @property {Function|null} [renderDescription] - Function to render description or null
 * @property {string} [renderHeader] - Header text for the overlay
 * @property {string} [renderSubmit] - Submit button text
 * @property {Function} triggerAction - Function to trigger actions
 */

/**
 * @param {DeploymentPluginOverlayProps} props
 */
export default function DeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionCheckResult,
    connectionManager,
    deployment,
    displayNotification,
    DeploymentConfigForm = DefaultDeploymentConfigForm,
    getErrorNotification = defaultGetErrorNotification,
    getResourceConfigs = defaultGetResourceConfigs,
    getSuccessNotification = defaultGetSuccessNotification,
    log,
    onClose,
    renderDescription = null,
    renderHeader = 'Deploy',
    renderSubmit = 'Deploy',
    triggerAction
  } = props;

  const [ isSubmitting, setIsSubmitting ] = React.useState(false);

  const handleChangeConnections = () => {
    onClose();
    triggerAction('open-connection-selector');
    return false;
  };

  const handleManageConnections = () => {
    onClose();
    triggerAction('settings-open');
    return false;
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    const connection = await connectionManager.getConnectionForTab(activeTab);

    const config = {
      context: 'deploymentTool',
      endpoint: connection
    };
    const resourceConfigs = getResourceConfigs(activeTab);

    const deploymentResponse = await deployment.deploy(resourceConfigs, config);

    if (deploymentResponse.success) {
      displayNotification(getSuccessNotification(activeTab, config, deploymentResponse));
    } else {
      displayNotification(getErrorNotification(triggerAction));

      log({
        category: 'deploy-error',
        message: deploymentResponse.response.details || deploymentResponse.response.message,
        silent: true
      });
    }

    setIsSubmitting(false);
    onClose();
  };


  useEffect(() => {
    const onDeployed = ({ context = 'deploymentTool', deploymentResult, endpoint, gatewayVersion }) => {
      if (deploymentResult.success) {
        triggerAction('emit-event', {
          type: 'deployment.done',
          payload: {
            deployment: deploymentResult.response,
            context,
            targetType: endpoint.targetType,
            deployedTo: {
              executionPlatformVersion: gatewayVersion,
              executionPlatform: ENGINES.CLOUD
            }
          }
        });
      } else {
        triggerAction('emit-event', {
          type: 'deployment.error',
          payload: {
            error: {
              ...deploymentResult.response,
              code: getGRPCErrorCode(deploymentResult.response)
            },
            context,
            targetType: endpoint.targetType,
            deployedTo: {
              executionPlatformVersion: gatewayVersion,
              executionPlatform: ENGINES.CLOUD
            }
          }
        });
      }
    };

    deployment.on('deployed', onDeployed);

    return () => deployment.off('deployed', onDeployed);
  }, [ deployment, triggerAction ]);

  return (
    <Overlay className={ css.DeploymentPluginOverlay } onClose={ onClose } anchor={ anchor }>
      <DeploymentConfigForm
        onSubmit={ onSubmit }
        renderDescription={ renderDescription }
        renderHeader={ renderHeader }
        renderSubmit={ renderSubmit }
        connectionCheckResult={ connectionCheckResult }
        isSubmitting={ isSubmitting }
        handleChangeConnections={ handleChangeConnections }
        handleManageConnections={ handleManageConnections }
      />
    </Overlay>
  );
}

function defaultGetResourceConfigs(activeTab) {
  const { file } = activeTab;

  return [
    {
      path: file.path,
      type: getResourceType(activeTab)
    }
  ];
}