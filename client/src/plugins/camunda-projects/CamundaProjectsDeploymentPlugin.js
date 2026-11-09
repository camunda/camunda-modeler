/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

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
    resourceConfigs = [],
    resourcesError = null,
    subscribe,
    triggerAction,
    connectionCheckResult
  } = props;

  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const deployment = _getGlobal('deployment');

  const anchorRef = useRef();

  // the overlay is anchored to the status bar button, so it closes with it
  const setAnchor = useCallback((anchor) => {
    anchorRef.current = anchor;

    if (!anchor) {
      setOverlayOpen(false);
    }
  }, []);

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    openOverlay();
  };

  const openOverlay = async () => {

    // TODO: save all tabs of project
    // currently this is not possible because to save a tab we need to select it first
    // see https://github.com/camunda/camunda-modeler/blob/develop/client/src/app/App.js#L1509
    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  const canOpen = camundaProject && canDeployTab(activeTab);

  // e.g. handed over by the file deployment once the saved file turns out to be in a project
  useEffect(() => {
    if (!canOpen) {
      return;
    }

    const subscription = subscribe('app.open-deployment', openOverlay);

    return () => subscription.cancel();
  }, [ subscribe, canOpen, activeTab ]);

  // every deployment in the context of the project (project deployment,
  // start instance, task testing) deploys the project resources
  useEffect(() => {
    const getResourceConfigs = (previousResourceConfigs) => {
      if (resourcesError) {
        throw new Error(resourcesError);
      }

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
  }, [ resourceConfigs, resourcesError ]);

  if (!camundaProject) {
    return null;
  }

  return <>
    { canDeployTab(activeTab) && (
      <Fill name="camunda-project-deployment" replaces="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open project deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ setAnchor }
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
        renderDescription={ getDeploymentDescription(resourceConfigs, resourcesError) }
        renderHeader={ <>
          <CamundaProjectIcon width="16" height="16" />Deploy project
        </> }
        renderSubmit="Deploy project"
        triggerAction={ triggerAction }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}

/**
 * @param {Array<{ path: string, type: string }>} resourceConfigs
 * @param {string|null} resourcesError
 *
 * @returns {string}
 */
export function getDeploymentDescription(resourceConfigs, resourcesError) {
  if (resourcesError) {
    return resourcesError;
  }

  return `${ resourceConfigs.length } ${ resourceConfigs.length === 1 ? 'file' : 'files' } will be deployed`;
}
