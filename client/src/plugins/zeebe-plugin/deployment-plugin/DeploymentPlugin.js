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

import DeployIcon from 'icons/Deploy.svg';

import DeploymentPluginOverlay from './DeploymentPluginOverlay';

import * as css from './DeploymentPlugin.less';

export default function DeploymentPlugin(props) {
  const {
    deployment,
    deploymentConfigValidator,
    deploymentConnectionValidator,
    subscribe,
    showNotification,
    triggerAction
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);

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
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);

      setOverlayOpen(false);
    });
  }, [ subscribe ]);

  return <React.Fragment>
    { canDeployTab(activeTab) && (
      <Fill name="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open deployment"
          className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': overlayOpen }) }
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
        onClose={ () => setOverlayOpen(false) }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        deploymentConnectionValidator={ deploymentConnectionValidator }
        showNotification={ showNotification }
        triggerAction={ triggerAction }
      />
    ) }
  </React.Fragment>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}