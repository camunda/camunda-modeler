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

import DeploymentConfigForm from '../deployment-plugin/DeploymentConfigForm';

import { getConnectionCheckError } from '../deployment-plugin/ConnectionCheckErrors';

import StartInstanceConfigForm from './StartInstanceConfigForm';

import {
  getSuccessNotification,
  getErrorNotification
} from './StartInstanceNotifications';

import Loader from '../../../app/primitives/Loader';

import { getProcessId, getResourceType } from '../shared/util';

import BPMNIcon from '../../../../resources/icons/file-types/BPMN.svg';

import * as css from './StartInstancePluginOverlay.less';

export default function StartInstancePluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionChecker,
    deployment,
    deploymentConfigValidator,
    displayNotification,
    log,
    onClose,
    startInstance,
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

  const getFieldError = (meta, fieldName) => {
    return getConnectionCheckError(fieldName, connectionCheckResult) || (meta.touched && meta.error);
  };

  const onSubmit = async (values) => {
    const startInstanceConfig = values;

    const { file } = activeTab;

    const deploymentResponse = await deployment.deploy([
      {
        path: file.path,
        type: getResourceType(activeTab)
      }
    ], deploymentConfig);

    if (!deploymentResponse.success) {
      displayNotification(getErrorNotification(triggerAction));

      log({
        category: 'deploy-error',
        message: deploymentResponse.response.details || deploymentResponse.response.message,
        silent: true
      });
    }

    if (deploymentResponse.success) {
      const processId = getProcessId(deploymentResponse.response);

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

      await deployment.setConfigForFile(activeTab.file, config);
    }

    return configValidationErrors;
  };

  const validateStartInstanceConfigForm = async (values) => {
    const config = values;

    const configValidationErrors = startInstanceConfigValidator.validateConfig(values);

    if (!Object.keys(configValidationErrors).length) {
      await startInstance.setConfigForFile(activeTab.file, config);
    }

    return configValidationErrors;
  };

  useEffect(() => {
    (async () => {
      const { file } = activeTab;

      const deploymentConfig = await deployment.getConfigForFile(file);

      setDeploymentConfig(deploymentConfig);

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
                getFieldError={ getFieldError }
                initialFieldValues={ deploymentConfig }
                onSubmit={ () => setShowDeploymentConfigForm(false) }
                renderHeader={ <><BPMNIcon width="16" height="16" />Configure deployment</> }
                renderSubmit="Done"
                validateForm={ validateDeploymentConfigForm }
                validateField={ (name, value) => deploymentConfigValidator.validateConfigValue(name, value) } />
            )
            : (
              <>
                <StartInstanceConfigForm
                  initialFieldValues={ startInstanceConfig }
                  onSubmit={ onSubmit }
                  renderHeader={ <><BPMNIcon width="16" height="16" />Start BPMN process instance</> }
                  renderSubmit="Start BPMN process instance"
                  validateForm={ validateStartInstanceConfigForm }
                  validateField={ (name, value) => startInstanceConfigValidator.validateConfigValue(name, value) } />
              </>
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