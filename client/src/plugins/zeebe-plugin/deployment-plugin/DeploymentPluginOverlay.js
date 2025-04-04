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

import { getConnectionCheckError } from './ConnectionCheckErrors';

import {
  getSuccessNotification,
  getErrorNotification
} from './DeploymentNotifications';

import Loader from '../../../app/primitives/Loader';

import { getResourceType } from '../shared/util';

import * as css from './DeploymentPluginOverlay.less';

export default function DeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionChecker,
    deployment,
    deploymentConfigValidator,
    displayNotification,
    log,
    onClose,
    tabIcon: TabIcon,
    tabName,
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

    const configValidationErrors = deploymentConfigValidator.validateConfig(values);

    if (Object.keys(configValidationErrors).length > 0) {
      connectionChecker.updateConfig(null);
    } else {
      connectionChecker.updateConfig(config);

      await deployment.setConfigForFile(activeTab.file, config);
    }

    return configValidationErrors;
  };

  useEffect(() => {
    (async () => {
      const { file } = activeTab;

      const config = await deployment.getConfigForFile(file);

      setConfig(config);
    })();

    connectionChecker.on('connectionCheck', setConnectionCheckResult);

    return () => {
      connectionChecker.off('connectionCheck', setConnectionCheckResult);

      connectionChecker.stopChecking();
    };
  }, [ connectionChecker, deployment, setConfig, setConnectionCheckResult ]);

  return (
    <Overlay className={ css.DeploymentPluginOverlay } onClose={ onClose } anchor={ anchor }>
      { config
        ? (
          <DeploymentConfigForm
            getFieldError={ getFieldError }
            initialFieldValues={ config }
            onSubmit={ onSubmit }
            renderHeader={ <><TabIcon width="16" height="16" />Deploy { tabName }</> }
            renderSubmit={ `Deploy ${ tabName }` }
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