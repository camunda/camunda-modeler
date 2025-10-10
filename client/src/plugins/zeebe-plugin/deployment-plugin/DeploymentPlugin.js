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

import { bootstrapDeployment } from '../shared/util';

import DeploymentPluginOverlay from './DeploymentPluginOverlay';

import DeployIcon from 'icons/Deploy.svg';

export default function DeploymentPlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    displayNotification,
    log,
    subscribe,
    triggerAction
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const [ {
    connectionChecker,
    deployment,
    deploymentConfigValidator
  }, setDeploymentBootstrapped ] = useState({
    connectionChecker: null,
    deployment: null,
    deploymentConfigValidator: null
  });

  const anchorRef = useRef();

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    openOverlay();
  };

  const openOverlay = async (tab = activeTab) => {
    const saved = await triggerAction('save-tab', { tab });

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

    setDeploymentBootstrapped({
      connectionChecker,
      deployment,
      deploymentConfigValidator
    });

    return () => {
      connectionChecker.stopChecking();
    };
  }, [ _getGlobal ]);

  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);

      setOverlayOpen(false);
    });

    subscribe('app.open-deployment', ({ tab }) => {
      openOverlay(tab);
    });
  }, [ subscribe ]);

  if (!activeTab || !connectionChecker || !deployment || !deploymentConfigValidator) {
    return null;
  }

  const tabsProvider = _getFromApp('props').tabsProvider;

  const TabIcon = tabsProvider.getTabIcon(activeTab.type) || (() => null);

  const tabName = tabsProvider.getProvider(activeTab.type)?.name || 'file';

  return <>
    { canDeployTab(activeTab) && (
      <Fill name="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open file deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && anchorRef.current && (
      <DeploymentPluginOverlay
        _getFromApp={ _getFromApp }
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        displayNotification={ displayNotification }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        renderHeader={ <><TabIcon width="16" height="16" />Deploy { tabName }</> }
        renderSubmit={ `Deploy ${ tabName }` }
        triggerAction={ triggerAction }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}
