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

import { SETTINGS_KEY_CONNECTIONS, initializeSettings } from './ConnectionManagerSettings';


import * as css from './ConnectionManagerPlugin.less';
import { ConnectionManagerOverlay } from './ConnectionManagerOverlay';
import { StatusIndicator } from '../shared/StatusIndicator';

const CONFIG_KEY = 'connection-manager';

/**
 *
 * @param {import('../../../app/plugins/CommonPluginProps').CommonPluginProps &
 * { connectionCheckResult: import('../deployment-plugin/types').ConnectionCheckResult, setConnectionCheckResult: (connectionCheckResult: import('../deployment-plugin/types').ConnectionCheckResult) => void }} props
 * @returns
 */
export default function ConnectionManagerPlugin(props) {

  const {
    _getFromApp,
    subscribe,
    settings,
    config,
    triggerAction,
    _getGlobal,
    connectionCheckResult,
    setConnectionCheckResult
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const [ connections, setConnections ] = useState([]);
  const [ activeConnection, setActiveConnection ] = useState(null);

  const deployment = _getGlobal('deployment');
  const connectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI')));

  const statusBarButtonRef = useRef(null);

  useEffect(() => {
    initializeSettings({ settings }).then(() => {
      settings.subscribe(SETTINGS_KEY_CONNECTIONS, (connections) => {
        setConnections(connections.value);
      });
      setConnections(settings.get(SETTINGS_KEY_CONNECTIONS));
    });
  }, [ settings ]);

  // close overlay on tab change
  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);
      setOverlayOpen(false);

    });
  }, [ subscribe ]);

  // load connection from file on tab change
  useEffect(() => {
    if (!activeTab) {
      return;
    }

    (async () => {
      const defaultConnection = await config.get(CONFIG_KEY);
      let { connectionId } = await config.getForFile(activeTab.file, CONFIG_KEY, {});

      if (!connectionId) {
        connectionId = defaultConnection?.connectionId;
        deployment.setConnectionForFile(activeTab.file, connectionId);
      }

      let connection = connections.find(conn => conn.id === connectionId);
      if (!connection && connections.length > 0) {
        connection = connections[0];
        deployment.setConnectionForFile(activeTab.file, connection.id);
      }

      setActiveConnection(connection);
    })();
  },
  [ activeTab, deployment, connections ]);

  // update connection checker on connection change
  useEffect(() => {
    (async () => {
      setConnectionCheckResult(null);
      if (activeConnection) {
        connectionChecker.current.updateConfig({ endpoint: activeConnection });
      }
      else {
        connectionChecker.current.updateConfig(null);
        connectionChecker.current.stopChecking();
      }
    })();

    const connectionCheckListener = (connectionCheckResult) => {
      setConnectionCheckResult(connectionCheckResult);
    };

    connectionChecker.current.on('connectionCheck', connectionCheckListener);

    return () => {
      connectionChecker.current.off('connectionCheck', connectionCheckListener);
      connectionChecker.current.stopChecking();
    };
  }, [ activeConnection, connectionChecker, deployment, setConnectionCheckResult ]);

  const tabsProvider = _getFromApp('props').tabsProvider;
  const TabIcon = activeTab ? tabsProvider.getTabIcon(activeTab?.type) || (() => null) : (() => null);

  function getStatus(connectionCheckResult, activeConnection) {
    if (connectionCheckResult) {
      return connectionCheckResult.success ? 'success' : 'error';
    }
    if (activeConnection) {
      return 'loading';
    }
    return 'idle';
  }

  const statusBarConnectionStatus = getStatus(connectionCheckResult, activeConnection);
  const statusBarText = activeConnection ? activeConnection.name || 'Unnamed connection' : 'No connections';
  return <>
    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager" className slot="status-bar__file" group="8_deploy" priority={ 2 }>
        <button
          onClick={ () => setOverlayOpen(!overlayOpen) }
          title="Open connection selector"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
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
        renderHeader={ <><TabIcon width="16" height="16" />Select connection</> }
        activeConnection={ activeConnection }
        handleManageConnections={ () => {
          setOverlayOpen(false);
          triggerAction('settings-open', { expandRowId: activeConnection?.id });
        } }
        handleConnectionChange={ async (connectionId)=> {
          await deployment.setConnectionForFile(activeTab.file, connectionId);
          const connection = (connections.find(conn => conn.id === connectionId));
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
