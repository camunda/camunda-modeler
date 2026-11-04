/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@camunda/design-system';

import { Section, Select } from '../../../shared/ui';
import { getMessageForReason, isC8RunConnection } from '../../zeebe-plugin/shared/util';
import { CONNECTION_CHECK_ERROR_REASONS } from '../deployment-plugin/ConnectionCheckErrors';
import { utmTag } from '../../../util/utmTag';
import { NO_CONNECTION } from './ConnectionManagerPlugin';
import { C8RUN_DOWNLOAD_URL, C8RUN_TROUBLESHOOTING_URL } from './constants';

const LOCAL_CLUSTER_URL = /^https?:\/\/(localhost|127\.0\.0\.1):8080(\/|$)/i;

export function ConnectionManagerOverlay({
  backend,
  connections = [],
  c8ctlConnections = [],
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

  const connectionLabel = (
    <>
      <span>Connection</span>
      <a className="manage-connections-link" onClick={ handleManageConnections } href="#">
        Manage connections
      </a>
    </>
  );

  const connectionOptions = [
    ...connections.map(connection => ({
      value: connection.id,
      label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
    })),
    { separator: true },
    ...c8ctlConnections.map(connection => ({
      value: connection.id,
      label: `${ connection.name } (from c8ctl)`
    })),
    ...(c8ctlConnections.length ? [ { separator: true } ] : []),
    { value: NO_CONNECTION.id, label: 'Disabled (offline mode)' }
  ];

  const getConnectionFieldError = () => {
    if (connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG) {
      const { reason } = connectionCheckResult;
      const shouldOmitPrefix = [
        CONNECTION_CHECK_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE,
        CONNECTION_CHECK_ERROR_REASONS.CLUSTER_UNAVAILABLE,
        CONNECTION_CHECK_ERROR_REASONS.CLUSTER_TEMPORARILY_UNAVAILABLE,
        CONNECTION_CHECK_ERROR_REASONS.UNKNOWN
      ].includes(reason);

      if (shouldOmitPrefix) {
        return getMessageForReason(reason);
      }

      return (
        <>
          Could not establish connection: <br />
          { getMessageForReason(reason) }
        </>
      );
    }
    return undefined;
  };

  const isLocal = isLocalClusterConnection(activeConnection);

  const getConnectionDescription = () => {
    const hasConnectionError = connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG;

    // the local cluster controls replace the hint
    if (isLocal && backend) {
      return null;
    }

    if (isC8RunConnection(activeConnection) && hasConnectionError) {
      return (
        <>
          <a data-testid="c8run-download-link" href={ C8RUN_DOWNLOAD_URL }>Download</a> or start Camunda 8 Run to connect. For help, see the <a data-testid="c8run-troubleshoot-link" href={ C8RUN_TROUBLESHOOTING_URL }>troubleshooting information</a>.
        </>
      );
    }
    return null;
  };

  function handleConnectionIdChange(connectionId) {
    const connection = [ ...connections, ...c8ctlConnections ].find(c => c.id === connectionId) || NO_CONNECTION;
    handleConnectionChange(connection);
  }

  return (
    <Section>
      <Section.Header className="form-header">
        {renderHeader}
      </Section.Header>
      <Section.Body className="form-body">
        <form className="fields">
          <Select
            field={ {
              name: 'connection',
              onChange: (event) => handleConnectionIdChange(event.target.value)
            } }
            name="connection"
            label={ connectionLabel }
            options={ connectionOptions }
            value={ activeConnection?.id }
            fieldError={ getConnectionFieldError }
            description={ getConnectionDescription() }
          />

          { isLocal && backend && <LocalCluster backend={ backend } /> }

          <div className="form-description">
            A connection to <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/connect-to-camunda-8/') }>Camunda 8</a> lets you test tasks, deploy resources, and run processes.
          </div>
        </form>
      </Section.Body>
    </Section>
  );
}

const LOCAL_CLUSTER_TEXT = {
  loading: 'Checking local Camunda…',
  running: 'Local Camunda is running.',
  stopped: 'Local Camunda is not running.',
  starting: 'Starting local Camunda. This can take a few minutes.',
  stopping: 'Stopping local Camunda…',
  unknown: 'Cannot read the status of local Camunda.'
};

/**
 * Status and start / stop of the local cluster, managed with c8ctl.
 */
function LocalCluster({ backend }) {
  const [ cluster, setCluster ] = useState({ status: 'loading' });
  const [ error, setError ] = useState(null);

  const refresh = useCallback(async () => {
    setCluster(await backend.send('c8ctl:clusterStatus'));
  }, [ backend ]);

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  // an operation started earlier keeps running in main while the overlay is closed
  useEffect(() => {
    if (![ 'starting', 'stopping' ].includes(cluster.status)) {
      return;
    }

    const timeout = setTimeout(refresh, 3000);

    return () => clearTimeout(timeout);
  }, [ cluster, refresh ]);

  const runOperation = async (channel, pendingStatus) => {
    setError(null);
    setCluster({ status: pendingStatus });

    const result = await backend.send(channel);

    if (!result.ok) {
      setError(result.error?.message || 'Operation failed');
    }

    refresh();
  };

  const { status, version } = cluster;

  const text = status === 'running' && version
    ? `Local Camunda ${ version } is running.`
    : LOCAL_CLUSTER_TEXT[ status ] || LOCAL_CLUSTER_TEXT.unknown;

  return (
    <div className="local-cluster" data-testid="local-cluster">
      <div className="local-cluster__status">
        <span>{ text }</span>
        { status === 'stopped' && (
          <Button variant="secondary" size="sm" onClick={ () => runOperation('c8ctl:clusterStart', 'starting') }>
            Start
          </Button>
        ) }
        { status === 'running' && (
          <Button variant="secondary" size="sm" onClick={ () => runOperation('c8ctl:clusterStop', 'stopping') }>
            Stop
          </Button>
        ) }
      </div>
      { error && <div className="local-cluster__error">{ error }</div> }
      <div className="local-cluster__hint">Managed with <code>c8ctl cluster</code>.</div>
    </div>
  );
}

function isLocalClusterConnection(connection) {
  if (!connection) {
    return false;
  }

  return LOCAL_CLUSTER_URL.test(connection.contactPoint || connection.url || '');
}
