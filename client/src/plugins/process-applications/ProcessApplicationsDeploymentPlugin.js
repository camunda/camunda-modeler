/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { Fill } from '../../app/slot-fill';

import ConnectionChecker from '../zeebe-plugin/deployment-plugin/ConnectionChecker';
import DeploymentConfigValidator from '../zeebe-plugin/deployment-plugin/DeploymentConfigValidator';

import DeployIcon from 'icons/Deploy.svg';
import ProcessApplicationIcon from 'icons/file-types/ProcessApplication.svg';

import DeploymentPluginOverlay from '../zeebe-plugin/deployment-plugin/DeploymentPluginOverlay';

import { getSuccessNotification } from './ProcessApplicationsDeploymentNotifications';

export default function ProcessApplicationsDeploymentPlugin(props) {
  const {
    _getGlobal,
    activeTab,
    displayNotification,
    log,
    processApplication,
    processApplicationItems,
    triggerAction
  } = props;

  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const deployment = _getGlobal('deployment');

  const connectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI')));

  const anchorRef = useRef();

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    // TODO: save all tabs of process application
    // currently this is not possible because to save a tab we need to select it first
    // see https://github.com/camunda/camunda-modeler/blob/develop/client/src/app/App.js#L1509
    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  const resourceConfigs = processApplicationItems.filter(canDeployItem).map((item) => {
    const { file, metadata } = item;

    const { path } = file;

    const { type } = metadata;

    return {
      path,
      type
    };
  });

  useEffect(() => {
    return () => {
      connectionChecker.current.stopChecking();
    };
  }, []);

  useEffect(() => {
    const getResourceConfigs = (previousResourceConfigs) => {
      return [
        ...previousResourceConfigs,
        ...resourceConfigs.filter((resourceConfig) => {
          return !previousResourceConfigs.some((prevConfig) => {
            return prevConfig.path === resourceConfig.path;
          });
        })
      ];
    };

    deployment.registerResourcesProvider(getResourceConfigs);

    return () => deployment.unregisterResourcesProvider(getResourceConfigs);
  }, [ processApplicationItems ]);

  if (!processApplication) {
    return null;
  }

  return <>
    { canDeployTab(activeTab) && (
      <Fill name="process-application-deployment" replaces="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open process application deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <DeploymentPluginOverlay
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker.current }
        deployment={ deployment }
        deploymentConfigValidator={ DeploymentConfigValidator }
        getConfigFile={ () => processApplication.file }
        getSuccessNotification={ (...args) => getSuccessNotification(...args, resourceConfigs) }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        displayNotification={ displayNotification }
        renderDescription={ `${ resourceConfigs.length } ${ resourceConfigs.length === 1 ? 'file' : 'files' } will be deployed` }
        renderHeader={ <>
          <ProcessApplicationIcon width="16" height="16" />Deploy process application
        </> }
        renderSubmit="Deploy process application"
        triggerAction={ triggerAction }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}

export function canDeployItem(item) {
  const { metadata } = item;

  if (!metadata) {
    return false;
  }

  const { type } = metadata;

  return [
    'bpmn',
    'dmn',
    'form',
    'rpa'
  ].includes(type);
}
