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
 * @typedef {import('./types').DeploymentConnectionValidationResult} DeploymentConnectionValidationResult
 */

import React, { useEffect, useState } from 'react';

import { Overlay } from '../../../shared/ui';

import DeploymentConfigForm from './DeploymentConfigForm';
import DeploymentConfigValidator from './DeploymentConfigValidator';

import { getDeploymentConnectionValidationError } from './DeploymentConnectionValidationErrors';

import {
  getSuccessNotification,
  getErrorNotification
} from './DeploymentNotifications';

import { getResourceType } from '../shared/util';

import * as css from './DeploymentPluginOverlay.less';

export default function DeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    deployment,
    deploymentConfigValidator,
    deploymentConnectionValidator,
    onClose,
    showNotification,
    triggerAction
  } = props;

  /** @type {DeploymentConfig} */
  const [ config, setConfig ] = useState(null);

  /** @type {DeploymentConnectionValidationResult} */
  const [ validateConnectionResult, setValidateConnectionResult ] = useState(null);

  const getFieldError = (meta, fieldName) => {
    return getDeploymentConnectionValidationError(fieldName, validateConnectionResult) || (meta.touched && meta.error);
  };

  const onSubmit = async (values) => {
    const config = values;

    const { file } = activeTab;

    const deploymentResponse = await deployment.deploy([
      {
        path: file.path,
        type: getResourceType(activeTab)
      }
    ], config);

    if (deploymentResponse.success) {
      showNotification(getSuccessNotification(activeTab, config, deploymentResponse));
    } else {
      showNotification(getErrorNotification(triggerAction));
    }
  };

  const validateForm = async (values) => {
    const config = values;

    const configValidationErrors = deploymentConfigValidator.validateConfig(values);

    if (Object.keys(configValidationErrors).length > 0) {
      deploymentConnectionValidator.stopConnectionValidation();

      return configValidationErrors;
    }

    const connectionValidationResult = await deploymentConnectionValidator.validateConnection(config);

    setValidateConnectionResult(connectionValidationResult);

    deploymentConnectionValidator.startConnectionValidation(config);
  };

  useEffect(async () => {
    const { file } = activeTab;

    let config = await deployment.getConfigForFile(file);

    const defaultEndpoint = deployment.getDefaultEndpoint();

    config = {
      ...config,
      endpoint: {
        ...defaultEndpoint,
        ...config.endpoint
      }
    };

    setConfig(config);

    const configValidationErrors = deploymentConfigValidator.validateConfig(config);

    if (Object.keys(configValidationErrors).length > 0) {
      deploymentConnectionValidator.stopConnectionValidation();

      return configValidationErrors;
    }

    const connectionValidationResult = await deploymentConnectionValidator.validateConnection(config);

    setValidateConnectionResult(connectionValidationResult);

    deploymentConnectionValidator.on('validate-connection-result', setValidateConnectionResult);

    return () => {
      deploymentConnectionValidator.off('validate-connection-result', setValidateConnectionResult);

      deploymentConnectionValidator.stopConnectionValidation();
    };
  }, [ setConfig, setValidateConnectionResult ]);

  return (
    <Overlay className={ css.DeploymentPluginOverlay } onClose={ onClose } anchor={ anchor }>
      { config
        ? (
          <DeploymentConfigForm
            getFieldError={ getFieldError }
            initialFieldValues={ config }
            onSubmit={ onSubmit }
            renderHeader="Deploy diagram"
            renderSubmit="Deploy diagram"
            validateForm={ validateForm }
            validateField={ (name, value) => DeploymentConfigValidator.validateConfigValue(name, value) } />
        )
        : <div>Loading...</div>
      }
    </Overlay>
  );
}