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

export default function DeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionCheckResult,
    deployment,
    displayNotification,
    DeploymentConfigForm = DefaultDeploymentConfigForm,
    getConfigFile = defaultGetConfigFile,
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

  const onSubmit = async () => {
    setIsSubmitting(true);
    const file = getConfigFile(activeTab);
    const config = await deployment.getConfigForFile(file);

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
      />
    </Overlay>
  );
}

function defaultGetConfigFile(activeTab) {
  const { file } = activeTab;

  return file;
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