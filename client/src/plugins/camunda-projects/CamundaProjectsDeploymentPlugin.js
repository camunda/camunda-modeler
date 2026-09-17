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

import DeployIcon from 'icons/Deploy.svg';
import CamundaProjectIcon from 'icons/file-types/CamundaProject.svg';

import DeploymentPluginOverlay from '../zeebe-plugin/deployment-plugin/DeploymentPluginOverlay';

import { getSuccessNotification } from './CamundaProjectsDeploymentNotifications';

export default function CamundaProjectsDeploymentPlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    activeTab,
    displayNotification,
    emit,
    log,
    camundaProject,
    camundaProjectItems,
    triggerAction,
    connectionCheckResult
  } = props;

  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const deployment = _getGlobal('deployment');

  const anchorRef = useRef();

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    // TODO: save all tabs of Camunda project
    // currently this is not possible because to save a tab we need to select it first
    // see https://github.com/camunda/camunda-modeler/blob/develop/client/src/app/App.js#L1509
    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  const resourceConfigs = camundaProjectItems.filter(canDeployItem).map((item) => {
    const { file, metadata } = item;

    const { path } = file;

    const { type } = metadata;

    return {
      path,
      type
    };
  });

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
  }, [ camundaProjectItems ]);

  if (!camundaProject) {
    return null;
  }

  return <>
    { canDeployTab(activeTab) && (
      <Fill name="camunda-project-deployment" replaces="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open Camunda project deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <DeploymentPluginOverlay
        _getFromApp={ _getFromApp }
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionCheckResult={ connectionCheckResult }
        deployment={ deployment }
        emit={ emit }
        getSuccessNotification={ (...args) => getSuccessNotification(...args, resourceConfigs) }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        displayNotification={ displayNotification }
        renderDescription={ `${ resourceConfigs.length } ${ resourceConfigs.length === 1 ? 'file' : 'files' } will be deployed` }
        renderHeader={ <>
          <CamundaProjectIcon width="16" height="16" />Deploy Camunda project
        </> }
        renderSubmit="Deploy Camunda project"
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
