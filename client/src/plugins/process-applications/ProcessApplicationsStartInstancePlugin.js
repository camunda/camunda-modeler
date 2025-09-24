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

import ProcessApplicationIcon from 'icons/file-types/ProcessApplication.svg';
import StartInstanceIcon from 'icons/Play.svg';

import StartInstancePluginOverlay from '../zeebe-plugin/start-instance-plugin/StartInstancePluginOverlay';

import {
  bootstrapDeployment,
  bootstrapStartInstance
} from '../zeebe-plugin/shared/util';

import { getSuccessNotification } from './ProcessApplicationsStartInstanceNotifications';

export default function ProcessApplicationsStartInstancePlugin(props) {
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

  const [ {
    connectionChecker,
    deployment,
    deploymentConfigValidator,
    startInstance,
    startInstanceConfigValidator
  }, setDeploymentAndStartInstanceBootstrapped ] = useState({
    connectionChecker: null,
    deployment: null,
    deploymentConfigValidator: null,
    startInstance: null,
    startInstanceConfigValidator: null
  });

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

  useEffect(() => {
    const {
      connectionChecker,
      deployment,
      deploymentConfigValidator
    } = bootstrapDeployment(_getGlobal('backend'), _getGlobal('config'));

    const {
      startInstance,
      startInstanceConfigValidator
    } = bootstrapStartInstance(_getGlobal('backend'), _getGlobal('config'));

    setDeploymentAndStartInstanceBootstrapped({
      connectionChecker,
      deployment,
      deploymentConfigValidator,
      startInstance,
      startInstanceConfigValidator
    });

    return () => {
      connectionChecker.stopChecking();
    };
  }, [ _getGlobal ]);

  if (!processApplication) {
    return null;
  }

  const resourceConfigs = processApplicationItems.filter(canDeployItem).map((item) => {
    const { file, metadata } = item;

    const { path } = file;

    const { type } = metadata;

    return {
      path,
      type
    };
  });

  return <>
    { canDeployTab(activeTab) && canStartInstanceTab(activeTab) && (
      <Fill name="process-application-start-instance" replaces="start-instance" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open process application start instance"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <StartInstanceIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <StartInstancePluginOverlay
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        getConfigFile={ () => processApplication.file }
        getResourceConfigs={ () => resourceConfigs }
        getSuccessNotification={ (...args) => getSuccessNotification(...args, resourceConfigs) }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        displayNotification={ displayNotification }
        renderDeploymentDescription={ `${ processApplicationItems.length } files will be deployed` }
        renderDeploymentHeader={ <>
          <ProcessApplicationIcon width="16" height="16" />Configure deployment
        </> }
        renderDeploymentSubmit="Go to start instance"
        renderStartInstanceHeader={ <><ProcessApplicationIcon width="16" height="16" />Start BPMN process instance</> }
        renderStartInstanceSubmit="Start BPMN process instance"
        startInstance={ startInstance }
        startInstanceConfigValidator={ startInstanceConfigValidator }
        triggerAction={ triggerAction }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
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

function canStartInstanceTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}