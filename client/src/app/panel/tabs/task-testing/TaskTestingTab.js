/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';

import semver from 'semver';

import TaskTesting from '@camunda/task-testing';

import { SIDE_PANEL_TABS } from '../../../resizable-container/SidePanelContainer';

import { debounce } from '../../../../util';

import TaskTestingStatusBarItem from './TaskTestingStatusBarItem';
import TaskTestingApi from './TaskTestingApi';

import { useConnectionStatus } from './hooks/useConnectionStatus';

import * as css from './TaskTestingTab.less';

import { utmTag } from '../../../../util/utmTag';
import { EventsContext } from '../../../EventsContext';


export const TAB_ID = 'task-testing';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

export const MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION = '8.8.0';
export const SUPPORTED_PROTOCOL = 'rest';

export const CANNOT_CONNECT_TITLE = 'Couldn\'t connect to Camunda';
export const CANNOT_CONNECT_DESCRIPTION = 'Configure a REST connection to a Camunda 8 cluster.';

export const UNSUPPORTED_PROTOCOL_TITLE = 'REST connection required';
export const UNSUPPORTED_PROTOCOL_DESCRIPTION = 'Task testing requires a REST connection to a Camunda 8 cluster. The current connection uses gRPC.';

export const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE = 'Execution platform version not supported';
export const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION = `Task testing requires Camunda ${MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION} or higher`;

const DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/task-testing/');

export default function TaskTestingTab(props) {
  const {
    config,
    deployment,
    injector,
    file,
    id,
    layout = {},
    onAction,
    startInstance,
    zeebeApi
  } = props;

  const { subscribe } = React.useContext(EventsContext);

  const [ taskTestingConfig, setTaskTestingConfig ] = useState(DEFAULT_CONFIG);

  const [ operateUrl, setOperateUrl ] = useState(null);

  const tab = useMemo(() => ({
    id: id?.includes('-') ? id.split('-')[0] : id,
    file
  }), [ id, file ]);

  const taskTestingApi = useMemo(() => {

    const api = new TaskTestingApi(deployment, startInstance, zeebeApi, tab, onAction);

    api.getOperateUrl().then(setOperateUrl);

    return api.getApi();
  }, [ zeebeApi, config, tab, onAction ]);

  const connectionCheckResult = useConnectionStatus(subscribe);

  useEffect(() => {
    const loadConfig = async () => {
      const fileConfig = await config.getForFile(file, 'taskTesting');

      if (!fileConfig) {
        return;
      }

      setTaskTestingConfig(fileConfig);
    };

    loadConfig();
  }, [ injector ]);

  useEffect(() => {
    const saveConfig = debounce(async (value) => {
      try {
        await config.setForFile(file, 'taskTesting', value);
      } catch (err) {
        console.error('Failed to save task testing config:', err);
      }
    });

    saveConfig(taskTestingConfig);

    return () => saveConfig.cancel();
  }, [ taskTestingConfig ]);

  const onToggle = () => {
    onAction('toggle-side-panel', { tab: SIDE_PANEL_TABS.TEST });
  };

  const handleTaskExecutionStarted = useCallback((element) => {
    onAction('emit-event', {
      type: 'taskTesting.started',
      payload: {
        element
      }
    });
  }, [ onAction ]);

  const handleTaskExecutionFinished = useCallback((element, output) => {
    onAction('emit-event', {
      type: 'taskTesting.finished',
      payload: {
        element,
        output
      }
    });
  }, [ onAction ]);

  const handleTaskExecutionInterrupted = useCallback(() => {
    onAction('display-notification', {
      type: 'warning',
      title: 'Task testing canceled',
    });
  }, [ onAction ]);

  const handleConfigureConnection = useCallback(() => {
    onAction('open-connection-selector');
  }, [ onAction ]);

  const isConnectionConfigured = canConnectToCluster(connectionCheckResult);

  const handleTestTask = useCallback(() => {
    if (!isConnectionConfigured) {
      handleConfigureConnection();
      return false;
    }

    return true;
  }, [ isConnectionConfigured, handleConfigureConnection ]);

  const configureConnectionBannerTitle = getConnectionBannerTitle(connectionCheckResult);
  const configureConnectionBannerDescription = getConfigureConnectionBannerDescription(connectionCheckResult);

  return <>
    <div className={ css.TaskTestingTab }>
      <TaskTesting
        injector={ injector }
        config={ taskTestingConfig }
        isConnectionConfigured={ isConnectionConfigured }
        onConfigChanged={ setTaskTestingConfig }
        operateBaseUrl={ operateUrl }
        onTaskExecutionStarted={ handleTaskExecutionStarted }
        onTaskExecutionFinished={ handleTaskExecutionFinished }
        onTaskExecutionInterrupted={ handleTaskExecutionInterrupted }
        onTestTask={ handleTestTask }
        configureConnectionBannerTitle={ configureConnectionBannerTitle }
        configureConnectionBannerDescription={ configureConnectionBannerDescription }
        api={ taskTestingApi }
        documentationUrl={ DOCUMENTATION_URL }
      />
    </div>
    <TaskTestingStatusBarItem
      layout={ layout }
      onToggle={ onToggle } />
  </>;
}

function getConnectionBannerTitle(connectionCheckResult) {
  if (!connectionCheckResult || !connectionCheckResult.success) {
    return CANNOT_CONNECT_TITLE;
  } else if (!isProtocolSupported(connectionCheckResult)) {
    return UNSUPPORTED_PROTOCOL_TITLE;
  } else if (!isExecutionPlatformVersionSupported(connectionCheckResult)) {
    return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE;
  }
  return null;
}

function getConfigureConnectionBannerDescription(connectionCheckResult) {
  if (!connectionCheckResult || !connectionCheckResult.success) {
    return CANNOT_CONNECT_DESCRIPTION;
  } else if (!isProtocolSupported(connectionCheckResult)) {
    return UNSUPPORTED_PROTOCOL_DESCRIPTION;
  } else if (!isExecutionPlatformVersionSupported(connectionCheckResult)) {
    return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION;
  }
  return null;
}

function canConnectToCluster(connectionCheckResult) {
  const protocolSupported = isProtocolSupported(connectionCheckResult);

  const gatewayVersionSupported = isExecutionPlatformVersionSupported(connectionCheckResult);

  return connectionCheckResult?.success && protocolSupported && gatewayVersionSupported;
}

function isProtocolSupported(connectionCheckResult) {
  return connectionCheckResult?.response?.protocol === SUPPORTED_PROTOCOL;
}

function isExecutionPlatformVersionSupported(connectionCheckResult) {
  const coercedVersion = semver.coerce(connectionCheckResult?.response?.gatewayVersion || '0');

  return semver.compare(coercedVersion || '0', MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION) >= 0;
}
