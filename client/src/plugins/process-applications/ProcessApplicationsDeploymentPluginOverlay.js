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

import { getSuccessNotification } from './ProcessApplicationsDeploymentNotifications';

import { Overlay, Section } from '../../shared/ui';

import DeploymentConfigForm from '../zeebe-plugin/deployment-plugin/DeploymentConfigForm';
import DeploymentConfigValidator from '../zeebe-plugin/deployment-plugin/DeploymentConfigValidator';

import { getConnectionCheckError } from '../zeebe-plugin/deployment-plugin/ConnectionCheckErrors';

import { getErrorNotification } from '../zeebe-plugin/deployment-plugin/DeploymentNotifications';

import Loader from '../../app/primitives/Loader';

import Icon from '../../../resources/icons/file-types/ProcessApplication.svg';

import * as css from './ProcessApplicationsDeploymentPluginOverlay.less';

export default function ProcessApplicationsDeploymentPluginOverlay(props) {
  const {
    activeTab,
    anchor,
    connectionChecker,
    deployment,
    deploymentConfigValidator,
    displayNotification,
    log,
    onClose,
    processApplicationItems,
    triggerAction
  } = props;

  /** @type {DeploymentConfig} */
  const [ config, setConfig ] = useState(null);

  /** @type {ConnectionCheckResult} */
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  const getFieldError = (meta, fieldName) => {
    return getConnectionCheckError(fieldName, connectionCheckResult) || (meta.touched && meta.error);
  };

  const resourceConfigs = getResourceConfigs(processApplicationItems);

  const onSubmit = async (values) => {
    const config = values;

    console.log('resourceConfigs', resourceConfigs);

    const deploymentResponse = await deployment.deploy(resourceConfigs, config);

    console.log('deploymentResponse', deploymentResponse);

    if (deploymentResponse.success) {
      displayNotification(getSuccessNotification(activeTab, config, deploymentResponse, resourceConfigs));
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
    <Overlay className={ css.ProcessApplicationsDeploymentPluginOverlay } onClose={ onClose } anchor={ anchor }>
      { config
        ? (
          <>
            <Section>
              <Section.Header>
                <Icon width="16" height="16" />Deploy process application
              </Section.Header>
              <Section.Body className="section__body-description">
                { resourceConfigs.length } files will be deployed
              </Section.Body>
            </Section>
            <DeploymentConfigForm
              getFieldError={ getFieldError }
              initialFieldValues={ config }
              onSubmit={ onSubmit }
              renderHeader={ null }
              renderSubmit="Deploy process application"
              validateForm={ validateForm }
              validateField={ (name, value) => DeploymentConfigValidator.validateConfigValue(name, value) } />
          </>
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

function getResourceConfigs(processApplicationItems) {
  return processApplicationItems.filter(canDeployItem).map((item) => {
    const { file, metadata } = item;

    const { path } = file;

    const { type } = metadata;

    return {
      path,
      type
    };
  });
}

function canDeployItem(item) {
  const { metadata } = item;

  if (!metadata) {
    return false;
  }

  const { type } = metadata;

  return [
    'bpmn',
    'dmn',
    'form'
  ].includes(type);
}