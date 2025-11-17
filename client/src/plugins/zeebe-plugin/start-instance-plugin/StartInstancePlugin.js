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

import { Fill } from '../../../app/slot-fill';

import ConnectionChecker from '../deployment-plugin/ConnectionChecker';
import DeploymentConfigValidator from '../deployment-plugin/DeploymentConfigValidator';
import StartInstanceConfigValidator from './StartInstanceConfigValidator';

import StartInstancePluginOverlay from './StartInstancePluginOverlay';

import BPMNIcon from 'icons/file-types/BPMN.svg';
import StartInstanceIcon from 'icons/Play.svg';

export default function StartInstancePlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    displayNotification,
    log,
    subscribe,
    triggerAction,
    connectionCheckResult
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const connectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI')));

  const anchorRef = useRef();

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  useEffect(() => {
    return () => {
      connectionChecker.current.stopChecking();
    };
  }, []);

  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);

      setOverlayOpen(false);
    });
  }, [ subscribe ]);

  if (!activeTab) {
    return null;
  }

  return <>
    { canDeployTab(activeTab) && canStartInstanceTab(activeTab) && (
      <Fill name="start-instance" slot="status-bar__file" group="8_deploy" priority={ 0 }>
        <button
          onClick={ onClick }
          title="Open start instance"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <StartInstanceIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <StartInstancePluginOverlay
        _getFromApp={ _getFromApp }
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker.current }
        deployment={ _getGlobal('deployment') }
        deploymentConfigValidator={ DeploymentConfigValidator }
        displayNotification={ displayNotification }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        renderDeploymentHeader={ <><BPMNIcon width="16" height="16" />Configure deployment</> }
        renderDeploymentSubmit="Go to start instance"
        renderStartInstanceHeader={ <><BPMNIcon width="16" height="16" />Start BPMN process instance</> }
        renderStartInstanceSubmit="Start BPMN process instance"
        startInstance={ _getGlobal('startInstance') }
        startInstanceConfigValidator={ StartInstanceConfigValidator }
        triggerAction={ triggerAction }
        connectionCheckResult={ connectionCheckResult }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}

function canStartInstanceTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}