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

import DeploymentConfigForm from './DeploymentConfigForm';
import DeploymentConfigValidator from './DeploymentConfigValidator';

import { getConnectionCheckError } from './ConnectionCheckErrors';

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
    connectionChecker,
    deployment,
    deploymentConfigValidator,
    onClose,
    showNotification,
    triggerAction
  } = props;

  /** @type {DeploymentConfig} */
  const [ config, setConfig ] = useState(null);

  /** @type {ConnectionCheckResult} */
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  const getFieldError = (meta, fieldName) => {
    return getConnectionCheckError(fieldName, connectionCheckResult) || (meta.touched && meta.error);
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
      connectionChecker.updateConfig(null);
    } else {
      connectionChecker.updateConfig(config);
    }

    return configValidationErrors;
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

    connectionChecker.on('connectionCheck', setConnectionCheckResult);

    return () => {
      connectionChecker.off('connectionCheck', setConnectionCheckResult);
    };
  }, [ setConfig, setConnectionCheckResult ]);

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