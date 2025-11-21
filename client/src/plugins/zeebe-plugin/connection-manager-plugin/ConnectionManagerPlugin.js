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
import { InlineLoading } from '@carbon/react';

import { Fill } from '../../../app/slot-fill';
import { Overlay, Section, Select } from '../../../shared/ui';
import { getMessageForReason } from '../../zeebe-plugin/shared/util';
import ConnectionChecker from '../deployment-plugin/ConnectionChecker';

import { SETTINGS_KEY_CONNECTIONS, initializeSettings } from './ConnectionManagerSettings';


import './ConnectionManagerPlugin.less';

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
  const [ paused, setPaused ] = useState(false);

  const [ connections, setConnections ] = useState([]);
  const [ activeConnection, setActiveConnection ] = useState(null);

  const deployment = _getGlobal('deployment');
  const globalConnectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI'),'plugin'));
  const settingsConnectionChecker = useRef(new ConnectionChecker(_getGlobal('zeebeAPI'),'settings'));

  const statusBarButtonRef = useRef(null);

  useEffect(() => {
    initializeSettings({ settings, connectionChecker: settingsConnectionChecker }).then(() => {
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
    subscribe('app.settings-open', () => {
      setPaused(true);
      globalConnectionChecker.current.stopChecking(null);
    });
    subscribe('settings.closed', () => {
      if (activeConnection) {
        setConnectionCheckResult(null);
        setPaused(false);
        globalConnectionChecker.current.startChecking();
      }
    });
  }, [ subscribe,activeConnection, globalConnectionChecker,setConnectionCheckResult ]);

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
        globalConnectionChecker.current.updateConfig({ endpoint: activeConnection }, !paused);
      }
      else {
        globalConnectionChecker.current.updateConfig(null);
        globalConnectionChecker.current.stopChecking();
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
  }, [ activeConnection, globalConnectionChecker, deployment, setConnectionCheckResult ]);

  const tabsProvider = _getFromApp('props').tabsProvider;
  const TabIcon = activeTab ? tabsProvider.getTabIcon(activeTab?.type) || (() => null) : (() => null);

  function getStatus(connectionCheckResult, activeConnection) {
    if (paused) {
      return 'inactive';
    }
    if (connectionCheckResult) {
      return connectionCheckResult.success ? 'finished' : 'error';
    }
    if (activeConnection) {
      return 'active';
    }
    return 'inactive';
  }

  const statusBarConnectionStatus = getStatus(connectionCheckResult, activeConnection);
  const statusBarText = activeConnection ? activeConnection.name || activeConnection.url || 'Unnamed Connection' : 'Select Connection';
  return <>
    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager" slot="status-bar__file" group="8_deploy" priority={ 2 }>
        <button
          onClick={ () => setOverlayOpen(!overlayOpen) }
          title="Open connection selector"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ statusBarButtonRef }
        >
          <InlineLoading
            className="connection-manager-loading-indicator"
            status={ statusBarConnectionStatus }
            description={ statusBarText }
          />
        </button>
      </Fill>
    }
    { overlayOpen && <Overlay className="connection-manager-overlay" onClose={ () => setOverlayOpen(false) } anchor={ statusBarButtonRef.current }>
      <ConnectionManagerOverlay
        connections={ connections }
        connectionCheckResult={ connectionCheckResult }
        renderHeader={ <><TabIcon width="16" height="16" />Select connection</> }
        activeConnection={ activeConnection }
        handleManageConnections={ () => {
          setOverlayOpen(false);
          const index = connections.findIndex(conn => conn.id === activeConnection?.id);
          triggerAction('settings-open', {
            scrollToEntry: index >= 0 ? `${SETTINGS_KEY_CONNECTIONS}[${index}].name` : SETTINGS_KEY_CONNECTIONS
          });
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


function ConnectionManagerOverlay({
  connections = [],
  handleConnectionChange,
  connectionCheckResult,
  activeConnection,
  handleManageConnections,
  renderHeader
}) {
  function getUrl(connection) {
    if (connection.targetType === 'selfHosted') {
      return connection.contactPoint;
    }
    if (connection.targetType === 'camundaCloud') {
      return connection.camundaCloudClusterUrl;
    }
  }

  return (
    <Section>
      <Section.Header className="form-header">
        {renderHeader}
      </Section.Header>
      <Section.Body className="form-body">
        <p>Select orchestration cluster connection.</p>
        {connections?.length ?
          <div className={ classNames('form-group', 'form-group-spacing') }>
            <div>
              <Select
                field={ {
                  name: 'connection',
                  onChange: (event) => handleConnectionChange(event.target.value)
                } }
                className="form-control"
                name="connection"
                placeholder="Please select a connection"
                options={ connections.map(connection => ({
                  value: connection.id,
                  label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
                })) }
                value={ activeConnection?.id }
                fieldError={ () => connectionCheckResult?.success === false ? getMessageForReason(connectionCheckResult?.reason) : undefined }
              />

            </div>
            <div className="manage-connections-container">
              <a className="manage-connections-link" onClick={ handleManageConnections }>
                Manage connections
              </a>
            </div>

          </div>
          :
          <div>
            <p className="empty-placeholder">No Connections Available</p>
            <div className="manage-connections-container">
              <a className="manage-connections-link" onClick={ handleManageConnections }>
                Add connections
              </a>
            </div>
          </div>
        }
      </Section.Body>
    </Section>
  );
}


/**
 * @param {{ type: string; }} tab
 */
function tabNeedsConnection(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}
