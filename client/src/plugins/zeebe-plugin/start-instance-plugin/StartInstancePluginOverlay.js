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

import { default as DefaultDeploymentConfigForm } from '../deployment-plugin/DeploymentConfigForm';

import { getConnectionCheckError } from '../deployment-plugin/ConnectionCheckErrors';

import { default as DefaultStartInstanceConfigForm } from './StartInstanceConfigForm';

import {
  getSuccessNotification as defaultGetSuccessNotification,
  getErrorNotification as defaultGetErrorNotification
} from './StartInstanceNotifications';

import Loader from '../../../app/primitives/Loader';

import {
  getProcessId,
  getResourceType
} from '../shared/util';

import * as css from './StartInstancePluginOverlay.less';

export default function StartInstancePluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionChecker,
    deployment,
    DeploymentConfigForm = DefaultDeploymentConfigForm,
    deploymentConfigValidator,
    displayNotification,
    getConfigFile = defaultGetConfigFile,
    getErrorNotification = defaultGetErrorNotification,
    getResourceConfigs = defaultGetResourceConfigs,
    getSuccessNotification = defaultGetSuccessNotification,
    log,
    onClose,
    renderDeploymentDescription = null,
    renderDeploymentHeader = 'Deploy',
    renderDeploymentSubmit = 'Deploy',
    renderStartInstanceDescription = null,
    renderStartInstanceHeader = 'Start instance',
    renderStartInstanceSubmit = 'Start instance',
    startInstance,
    StartInstanceConfigForm = DefaultStartInstanceConfigForm,
    startInstanceConfigValidator,
    triggerAction
  } = props;

  /** @type {DeploymentConfig} */
  const [ deploymentConfig, setDeploymentConfig ] = useState(null);

  /** @type {ConnectionCheckResult} */
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  /** @type {StartInstanceConfig} */
  const [ startInstanceConfig, setStartInstanceConfig ] = useState(null);

  const [ showDeploymentConfigForm, setShowDeploymentConfigForm ] = useState(false);

  useEffect(() => {
    if (connectionCheckResult && !connectionCheckResult.success) {
      setShowDeploymentConfigForm(true);
    }
  }, [ connectionCheckResult ]);

  const getDeploymentFieldError = (meta, fieldName) => {
    return getConnectionCheckError(fieldName, connectionCheckResult) || meta.error;
  };

  const getStartInstanceFieldError = (meta, fieldName) => {
    return meta.error;
  };

  const onSubmit = async (values) => {
    const startInstanceConfig = values;

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

      const startInstanceResult = await startInstance.startInstance(processId, {
        ...deploymentConfig,
        ...startInstanceConfig
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

  const validateDeploymentConfigForm = async (values) => {
    const config = values;

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

  const validateStartInstanceConfigForm = async (values) => {
    const config = values;

    const configValidationErrors = startInstanceConfigValidator.validateConfig(values);

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

      connectionChecker.updateConfig(deploymentConfig);

      const startInstanceConfig = await startInstance.getConfigForFile(file);

      setStartInstanceConfig(startInstanceConfig);
    })();

    connectionChecker.on('connectionCheck', setConnectionCheckResult);

    return () => {
      connectionChecker.off('connectionCheck', setConnectionCheckResult);

      connectionChecker.stopChecking();
    };
  }, [ connectionChecker, deployment, setConnectionCheckResult, setDeploymentConfig, setStartInstanceConfig, startInstance ]);

  return (
    <Overlay className={ css.StartInstancePluginOverlay } onClose={ onClose } anchor={ anchor }>
      { deploymentConfig && startInstanceConfig
        ? (
          showDeploymentConfigForm
            ? (
              <DeploymentConfigForm
                getFieldError={ getDeploymentFieldError }
                initialFieldValues={ deploymentConfig }
                onSubmit={ () => setShowDeploymentConfigForm(false) }
                renderDescription={ renderDeploymentDescription }
                renderHeader={ renderDeploymentHeader }
                renderSubmit={ renderDeploymentSubmit }
                validateForm={ validateDeploymentConfigForm }
                validateField={ (name, value) => deploymentConfigValidator.validateConfigValue(name, value) } />
            )
            : (
              <StartInstanceConfigForm
                getFieldError={ getStartInstanceFieldError }
                initialFieldValues={ startInstanceConfig }
                onSubmit={ onSubmit }
                renderDescription={ renderStartInstanceDescription }
                renderHeader={ renderStartInstanceHeader }
                renderSubmit={ renderStartInstanceSubmit }
                validateForm={ validateStartInstanceConfigForm }
                validateField={ (name, value) => startInstanceConfigValidator.validateConfigValue(name, value) } />
            )
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