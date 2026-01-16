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
import { Overlay } from '../../../shared/ui';

import ConnectionChecker from '../deployment-plugin/ConnectionChecker';
import { CONNECTION_MANAGER_PLUGIN_ID, SETTINGS_KEY_CONNECTIONS, initializeSettings } from './ConnectionManagerSettings';
import { ConnectionManagerOverlay } from './ConnectionManagerOverlay';
import { StatusIndicator } from '../shared/StatusIndicator';
import { CONNECTION_CHECK_ERROR_REASONS } from '../deployment-plugin/ConnectionCheckErrors';

import * as css from './ConnectionManagerPlugin.less';

export const NO_CONNECTION = {
  id: 'NO_CONNECTION',
  name: 'No connection'
};

/**
 *
 * @param {import('../../../app/plugins/CommonPluginProps').CommonPluginProps &
 * { connectionCheckResult: import('../deployment-plugin/types').ConnectionCheckResult, setConnectionCheckResult: (connectionCheckResult: import('../deployment-plugin/types').ConnectionCheckResult) => void }} props
 * @returns
 */
export default function ConnectionManagerPlugin(props) {

  const {
    subscribe,
    settings,
    triggerAction,
    _getGlobal,
    connectionCheckResult,
    setConnectionCheckResult
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);
  const [ paused, setPaused ] = useState(false);

  const [ connections, setConnections ] = useState([]);
  const [ activeConnection, setActiveConnection ] = useState(null);


  /**
   * @type {import('../../../app/zeebe/Deployment').default}
   */
  const deployment = _getGlobal('deployment');
  const globalConnectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI'), 'plugin'));
  const settingsConnectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI'), 'settings'));

  const statusBarButtonRef = useRef(null);

  useEffect(() => {
    initializeSettings({
      settings,
      connectionChecker: settingsConnectionChecker,
    }).then(() => {
      settings.subscribe(SETTINGS_KEY_CONNECTIONS, (connections) => {
        setConnections(connections.value);
      });
      setConnections(deployment.getEndpoints());
    });
  }, [ settings ]);


  // close overlay on tab change
  useEffect(() => {
    const subscription = subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);
      setOverlayOpen(false);
    });

    return () => {
      subscription.cancel();
    };
  }, [ subscribe ]);

  // enable external opening
  useEffect(() => {
    const subscription = subscribe('app.open-connection-selector', () => {
      setOverlayOpen(true);
    });

    return () => {
      subscription.cancel();
    };
  }, [ subscribe ]);

  // handle tab saved event to persist connection
  useEffect(() => {
    const subscription = subscribe('tab.saved', ({ tab }) => {
      deployment.onTabSaved(tab);
    });

    return () => {
      subscription.cancel();
    };
  }, [ subscribe, deployment ]);

  // pause connection checking when settings are opened
  useEffect(() => {
    const subscription = subscribe('app.settings-open', () => {
      setPaused(true);
      globalConnectionChecker.current.stopChecking(null);
    });

    return () => {
      subscription.cancel();
    };
  }, [ subscribe ]);

  useEffect(() => {
    const subscription = subscribe('settings.closed', () => {
      if (activeConnection) {
        setConnectionCheckResult(null);
        setPaused(false);
        globalConnectionChecker.current.updateConfig({ endpoint: activeConnection });
      }
    });
    return () => {
      subscription.cancel();
    };
  }, [
    subscribe,
    activeConnection,
    globalConnectionChecker,
    setConnectionCheckResult,
  ]);

  // load connection from tab on tab change
  useEffect(() => {
    if (!activeTab) {
      setActiveConnection(null);
      return;
    }

    (async () => {
      const connection = await deployment.getConnectionForTab(activeTab);
      setActiveConnection(connection);
    })();
  }, [ activeTab, deployment, connections ]);

  // update connection checker on connection change
  useEffect(() => {
    (async () => {
      setConnectionCheckResult(null);
      if (activeConnection && activeConnection.id !== NO_CONNECTION.id && !paused) {
        globalConnectionChecker.current.updateConfig({ endpoint: activeConnection });
      }
      else {
        globalConnectionChecker.current.stopChecking();
        globalConnectionChecker.current.updateConfig(null, false);
        setConnectionCheckResult({
          success: false,
          reason: CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG,
        });
      }
    })();

    const connectionCheckListener = (connectionCheckResult) => {
      triggerAction('emit-event', {
        type: 'connectionManager.connectionStatusChanged',
        payload: connectionCheckResult
      });
      setConnectionCheckResult(connectionCheckResult);
    };

    globalConnectionChecker.current.on('connectionCheck', connectionCheckListener);

    return () => {
      globalConnectionChecker.current.off('connectionCheck', connectionCheckListener);
      globalConnectionChecker.current.stopChecking();
    };
  }, [ activeConnection, globalConnectionChecker, deployment, setConnectionCheckResult, paused, triggerAction ]);

  function getStatus(connectionCheckResult, activeConnection) {
    if (activeConnection?.id === NO_CONNECTION.id || paused) {
      return 'idle';
    }
    if (connectionCheckResult) {
      return connectionCheckResult.success ? 'success' : 'error';
    }
    if (activeConnection && activeConnection.id !== NO_CONNECTION.id) {
      return 'loading';
    }
    return 'idle';
  }

  const statusBarConnectionStatus = getStatus(connectionCheckResult, activeConnection);
  const statusBarText = activeConnection ? activeConnection.name || 'Unnamed connection' : 'No connection';
  return <>
    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager" slot="status-bar__file" group="8_deploy" priority={ 2 }>
        <button
          onClick={ () => setOverlayOpen(!overlayOpen) }
          title="Configure Camunda 8 connection"
          className={ classNames(css.ConnectionSelector, 'btn', { 'btn--active': overlayOpen }) }
          ref={ statusBarButtonRef }
        >
          <StatusIndicator status={ statusBarConnectionStatus } text={ statusBarText }></StatusIndicator>
        </button>
      </Fill>
    }
    { overlayOpen && <Overlay className={ css.ConnectionManagerOverlay } onClose={ () => setOverlayOpen(false) } anchor={ statusBarButtonRef.current }>
      <ConnectionManagerOverlay
        connections={ connections }
        connectionCheckResult={ connectionCheckResult }
        renderHeader="Select Camunda 8 connection"
        activeConnection={ activeConnection }
        handleManageConnections={ () => {
          setOverlayOpen(false);
          const index = connections.findIndex((conn) => conn.id === activeConnection?.id);
          triggerAction('settings-open', {
            scrollToEntry:
              index >= 0
                ? `${SETTINGS_KEY_CONNECTIONS}[${index}].name`
                : CONNECTION_MANAGER_PLUGIN_ID,
          });
        } }
        handleConnectionChange={ async (connection) => {
          await deployment.setConnectionIdForTab(activeTab, connection.id);
          setActiveConnection(connection);
        }
        }
      />
    </Overlay>
    }
  </>;
}



/**
 * @param {{ type: string; }} tab
 */
function tabNeedsConnection(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}
