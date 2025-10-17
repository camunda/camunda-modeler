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

import React, { useEffect, useState } from 'react';

import { Overlay } from '../../../shared/ui';

import { default as DefaultDeploymentConfigForm } from './DeploymentConfigForm';

import { getConnectionCheckError } from './ConnectionCheckErrors';

import {
  getSuccessNotification as defaultGetSuccessNotification,
  getErrorNotification as defaultGetErrorNotification
} from './DeploymentNotifications';

import Loader from '../../../app/primitives/Loader';

import { getGRPCErrorCode, getResourceType } from '../shared/util';

import { ENGINES } from '../../../util/Engines';

import * as css from './DeploymentPluginOverlay.less';

export default function DeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionChecker,
    deployment,
    deploymentConfigValidator,
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

  /** @type {DeploymentConfig} */
  const [ config, setConfig ] = useState(null);

  /** @type {ConnectionCheckResult} */
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  const getFieldError = (fieldName) => {
    return getConnectionCheckError(fieldName, connectionCheckResult);
  };

  const onSubmit = async (values) => {
    setConfig(values);

    const resourceConfigs = getResourceConfigs(activeTab);

    const deploymentResponse = await deployment.deploy(resourceConfigs, values);

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

    onClose();
  };

  const validateForm = async (values) => {
    const config = values;

    setConfig(config);

    const configValidationErrors = deploymentConfigValidator.validateConfig(values);

    if (Object.keys(configValidationErrors).length > 0) {
      connectionChecker.updateConfig(null);
    } else {
      connectionChecker.updateConfig(config);

      const file = getConfigFile(activeTab);

      await deployment.setConfigForFile(file, config);
    }

    return configValidationErrors;
  };

  useEffect(() => {
    (async () => {
      const file = getConfigFile(activeTab);

      const config = await deployment.getConfigForFile(file);

      connectionChecker.updateConfig(config);

      setConfig(config);
    })();

    connectionChecker.on('connectionCheck', setConnectionCheckResult);

    return () => {
      connectionChecker.off('connectionCheck', setConnectionCheckResult);

      connectionChecker.stopChecking();
    };
  }, [ connectionChecker, deployment, setConfig, setConnectionCheckResult ]);

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
      { config
        ? (
          <DeploymentConfigForm
            getFieldError={ getFieldError }
            initialFieldValues={ config }
            onSubmit={ onSubmit }
            renderDescription={ renderDescription }
            renderHeader={ renderHeader }
            renderSubmit={ renderSubmit }
            validateForm={ validateForm }
            validateField={ (name, value) => deploymentConfigValidator.validateConfigValue(name, value) } />
        )
        : (
          <div className="loading">
            <Loader />
          </div>
        )
      }
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