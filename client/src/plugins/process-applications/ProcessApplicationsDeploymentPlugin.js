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

import ProcessApplicationsDeploymentPluginOverlay from './ProcessApplicationsDeploymentPluginOverlay';

import { bootstrapDeployment } from '../zeebe-plugin/shared/util';

import * as css from './ProcessApplicationsDeploymentPlugin.less';

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

    setDeploymentBootstrapped({
      connectionChecker,
      deployment,
      deploymentConfigValidator
    });

    return () => {
      connectionChecker.stopChecking();
    };
  }, [ _getGlobal ]);

  if (!processApplication) {
    return null;
  }

  return <>
    { canDeployTab(activeTab) && (
      <Fill name="process-application-deployment" replaces="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open process application deployment"
          className={ classNames('btn', css.ProcessApplicationsDeploymentPlugin, { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <ProcessApplicationsDeploymentPluginOverlay
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        processApplicationItems={ processApplicationItems }
        displayNotification={ displayNotification }
        triggerAction={ triggerAction }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}