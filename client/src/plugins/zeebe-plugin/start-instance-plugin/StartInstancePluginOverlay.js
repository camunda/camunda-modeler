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
 * @typedef {import('../deployment-plugin/types').ConnectionCheckResult} ConnectionCheckResult
 * @typedef {import('./types').StartInstanceConfig} StartInstanceConfig
 */

import React, { useEffect, useState } from 'react';

import { Overlay } from '../../../shared/ui';

import { default as DefaultStartInstanceConfigForm } from './StartInstanceConfigForm';

import {
  getSuccessNotification as defaultGetSuccessNotification,
  getErrorNotification as defaultGetErrorNotification
} from './StartInstanceNotifications';

import Loader from '../../../app/primitives/Loader';

import {
  getGRPCErrorCode,
  getProcessId,
  getResourceType
} from '../shared/util';

import { ENGINES } from '../../../util/Engines';

import * as css from './StartInstancePluginOverlay.less';

export default function StartInstancePluginOverlay(props) {
  const {
    activeTab,
    anchor,
    deployment,
    displayNotification,
    getConfigFile = defaultGetConfigFile,
    getErrorNotification = defaultGetErrorNotification,
    getResourceConfigs = defaultGetResourceConfigs,
    getSuccessNotification = defaultGetSuccessNotification,
    log,
    onClose,
    renderStartInstanceDescription = null,
    renderStartInstanceHeader = 'Start instance',
    renderStartInstanceSubmit = 'Deploy & run',
    startInstance,
    StartInstanceConfigForm = DefaultStartInstanceConfigForm,
    startInstanceConfigValidator,
    triggerAction,
    connectionCheckResult
  } = props;


  const [ deploymentConfig, setDeploymentConfig ] = useState(/** @type {DeploymentConfig|null} */ (null));

  const [ startInstanceConfig, setStartInstanceConfig ] = useState(/** @type {StartInstanceConfig|null} */ (null));

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

  const getStartInstanceFieldError = (fieldName) => {
    return null;
  };

  const onStartInstanceSubmit = async (values) => {
    setStartInstanceConfig(values);

    const resourceConfigs = getResourceConfigs(activeTab);

    const deploymentResponse = await deployment.deploy(resourceConfigs, deploymentConfig);

    if (!deploymentResponse.success) {
      displayNotification(getErrorNotification(triggerAction));

      log({
        category: 'deploy-error',
        message: deploymentResponse.response.details || deploymentResponse.response.message,
        silent: true
      });
    }

    if (deploymentResponse.success) {
      const { file } = activeTab;

      const processId = getProcessId(deploymentResponse, file.name);

      if (!processId) {
        displayNotification(getErrorNotification(triggerAction));

        log({
          category: 'start-instance-error',
          message: 'No process ID found in deployment response',
          silent: true
        });

        return;
      }

      const startInstanceResult = await startInstance.startInstance({
        processId,
        ...deploymentConfig,
        ...values
      });

      if (startInstanceResult.success) {
        displayNotification(getSuccessNotification(activeTab, deploymentConfig, startInstanceResult));
      } else {
        displayNotification(getErrorNotification(triggerAction));

        log({
          category: 'start-instance-error',
          message: startInstanceResult.response.details || startInstanceResult.response.message,
          silent: true
        });
      }
    }

    onClose();
  };

  const validateStartInstanceConfigForm = async (values) => {
    const config = values;

    setStartInstanceConfig(config);

    const configValidationErrors = startInstanceConfigValidator.validateConfig(config);

    if (!Object.keys(configValidationErrors).length) {
      const file = getConfigFile(activeTab);

      await startInstance.setConfigForFile(file, config);
    }

    return configValidationErrors;
  };

  useEffect(() => {
    (async () => {
      const file = getConfigFile(activeTab);

      const deploymentConfig = await deployment.getConfigForFile(file);

      setDeploymentConfig(deploymentConfig);

      const startInstanceConfig = await startInstance.getConfigForFile(file);

      setStartInstanceConfig(startInstanceConfig);
    })();



  }, [ deployment, setDeploymentConfig, setStartInstanceConfig, startInstance ]);

  useEffect(() => {
    const onDeployed = ({ deploymentResult, endpoint, gatewayVersion }) => {
      if (deploymentResult.success) {
        triggerAction('emit-event', {
          type: 'deployment.done',
          payload: {
            deployment: deploymentResult.response,
            context: 'startInstanceTool',
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
            context: 'startInstanceTool',
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
    <Overlay className={ css.StartInstancePluginOverlay } onClose={ onClose } anchor={ anchor }>
      {startInstanceConfig ? (
        <StartInstanceConfigForm
          getFieldError={ getStartInstanceFieldError }
          initialFieldValues={ startInstanceConfig }
          onSubmit={ onStartInstanceSubmit }
          renderDescription={ renderStartInstanceDescription }
          renderHeader={ renderStartInstanceHeader }
          renderSubmit={ renderStartInstanceSubmit }
          validateForm={ validateStartInstanceConfigForm }
          validateField={ (name, value) => startInstanceConfigValidator.validateConfigValue(name, value) }
          connectionCheckResult={ connectionCheckResult }
          handleChangeConnections={ handleChangeConnections }
          handleManageConnections={ handleManageConnections }
        />
      ) : (

        <div className="loading">
          <Loader />
        </div>
      )}
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