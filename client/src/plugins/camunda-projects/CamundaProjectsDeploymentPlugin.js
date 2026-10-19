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

    // TODO: save all tabs of project
    // currently this is not possible because to save a tab we need to select it first
    // see https://github.com/camunda/camunda-modeler/blob/develop/client/src/app/App.js#L1509
    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  const itemResourceConfigs = camundaProjectItems.filter(canDeployItem).map((item) => {
    const { file, metadata } = item;

    const { path } = file;

    const { type } = metadata;

    return {
      path,
      type
    };
  });

  const resourceConfigs = [
    ...itemResourceConfigs,
    ...getDeclaredResourceConfigs(camundaProject).filter((resourceConfig) => {
      return !itemResourceConfigs.some(({ path }) => path === resourceConfig.path);
    })
  ];

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
  }, [ camundaProject, camundaProjectItems ]);

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

/**
 * Get the resources a Camunda project declares in the `resources` property of
 * its `camunda.json`, for files deployed with the project that the Modeler
 * does not open, such as scripts. Paths are relative to `camunda.json`; paths
 * that are absolute or leave the project directory are ignored.
 *
 * @example
 *
 * {
 *   "resources": [ "scripts/sum.js" ]
 * }
 *
 * @param {Object|null} camundaProject
 *
 * @returns {Array<{ path: string, type: 'resource' }>}
 */
export function getDeclaredResourceConfigs(camundaProject) {
  const resources = camundaProject && camundaProject.resources;

  if (!Array.isArray(resources)) {
    return [];
  }

  const { dirname, path } = camundaProject.file;

  const projectDirectory = dirname || path.replace(/[\\/][^\\/]*$/, '');

  const separator = projectDirectory.includes('\\') ? '\\' : '/';

  return resources
    .filter(isProjectRelativePath)
    .map((resource) => {
      const segments = resource.split(/[\\/]/).filter(segment => segment && segment !== '.');

      return {
        path: [ projectDirectory, ...segments ].join(separator),
        type: 'resource'
      };
    });
}

function isProjectRelativePath(resource) {
  if (typeof resource !== 'string' || !resource.trim()) {
    return false;
  }

  if (/^([\\/]|[a-zA-Z]:)/.test(resource)) {
    return false;
  }

  return !resource.split(/[\\/]/).includes('..');
}
