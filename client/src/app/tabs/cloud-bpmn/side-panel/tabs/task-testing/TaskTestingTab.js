/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';

import semver from 'semver';

import TaskTesting from '@camunda/task-testing';

import { debounce } from '../../../../../../util';

import TaskTestingApi from './TaskTestingApi';

import { useConnectionStatus } from '../../../../../hooks/useConnectionStatus';

import * as css from './TaskTestingTab.css';

import { utmTag } from '../../../../../../util/utmTag';
import { EventsContext } from '../../../../../EventsContext';


export const TAB_ID = 'task-testing';

export const TEST_TAB_ID = 'test';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

export const MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION = '8.8.0';
export const SUPPORTED_PROTOCOL = 'rest';

export const CANNOT_CONNECT_TITLE = 'Couldn\'t connect to Camunda 8';
export const CANNOT_CONNECT_DESCRIPTION = 'Configure a REST connection to Camunda 8.';

export const UNSUPPORTED_PROTOCOL_TITLE = 'REST connection required';
export const UNSUPPORTED_PROTOCOL_DESCRIPTION = 'Task testing requires a REST connection. The current connection uses gRPC.';

export const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE = 'Execution platform version not supported';
export const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION = `Task testing requires Camunda ${MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION} or higher`;

export const LINTING_ERRORS_TITLE = 'Diagram has errors';
export const LINTING_ERRORS_DESCRIPTION = 'Task testing requires a diagram without errors.';

export const DEFAULT_CONFIGURE_DESCRIPTION = 'Configure connection.';

export const CONFIGURE_CONNECTION_LABEL = 'Configure connection';
export const SHOW_PROBLEMS_LABEL = 'Show problems';

const DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/task-testing/');

export default function TaskTestingTab(props) {
  const {
    config,
    deployment,
    injector,
    file,
    linting,
    onAction,
    startInstance,
    tabId,
    zeebeApi
  } = props;

  const { subscribe, emit } = useContext(EventsContext);

  const [ taskTestingConfig, setTaskTestingConfig ] = useState(DEFAULT_CONFIG);

  const [ operateUrl, setOperateUrl ] = useState(null);
  const [ tasklistUrl, setTasklistUrl ] = useState(null);

  const tab = useMemo(() => ({
    id: tabId,
    file
  }), [ tabId, file ]);

  const taskTestingApi = useMemo(() => {
    return new TaskTestingApi(deployment, startInstance, zeebeApi, tab, onAction, emit);
  }, [ deployment, startInstance, zeebeApi, tab, onAction, emit ]);

  const api = useMemo(() => taskTestingApi.getApi(), [ taskTestingApi ]);

  useEffect(() => {
    let canceled = false;

    taskTestingApi.getOperateUrl().then(url => {
      if (!canceled) {
        setOperateUrl(url);
      }
    });

    taskTestingApi.getTasklistUrl().then(url => {
      if (!canceled) {
        setTasklistUrl(url);
      }
    });

    return () => {
      canceled = true;
    };
  }, [ taskTestingApi ]);

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

  const handleTaskExecutionStarted = useCallback((element) => {
    emit('taskTesting.started', {
      element
    });
  }, [ emit ]);

  const handleTaskExecutionFinished = useCallback((element, result) => {

    const {
      success,
      reason,
      lastPolledResult,
      incident
    } = result;

    if (!success && reason === 'user.selectionChanged') {
      handleTaskExecutionInterrupted();
      return;
    }

    emit('taskTesting.finished', {
      element: element,
      success,
      incident,
      output: lastPolledResult
    });
  }, [ emit ]);

  const handleTaskExecutionInterrupted = useCallback(() => {
    onAction('display-notification', {
      type: 'info',
      title: 'Test canceled',
    });
  }, [ onAction ]);

  const handleConfigureConnection = useCallback(() => {
    onAction('open-connection-selector');
  }, [ onAction ]);

  const handleOpenLintingPanel = useCallback(() => {
    onAction('open-panel', { tab: 'linting' });
  }, [ onAction ]);

  const hasLintErrors = linting && linting.some(({ category }) => category === 'error');

  const canConnect = canConnectToCluster(connectionCheckResult);

  // no result yet means the check is still running, not that it failed
  const hasConnectionError = !!connectionCheckResult && !canConnect;
  const hasError = hasConnectionError || hasLintErrors;

  const handleTestTask = useCallback(() => {
    if (!canConnect) {
      handleConfigureConnection();

      return false;
    }

    if (hasLintErrors) {
      handleOpenLintingPanel();
    }

    return true;
  }, [ canConnect, hasLintErrors, handleConfigureConnection, handleOpenLintingPanel ]);

  const errorTitle = getErrorTitle(connectionCheckResult, hasLintErrors);
  const errorDescription = getErrorDescription(connectionCheckResult, hasLintErrors);
  const errorActionLabel = !hasConnectionError && hasLintErrors ? SHOW_PROBLEMS_LABEL : CONFIGURE_CONNECTION_LABEL;

  const handleConfigure = useCallback(() => {
    if (!hasConnectionError && hasLintErrors) {
      handleOpenLintingPanel();
      return;
    }

    handleConfigureConnection();
  }, [ hasConnectionError, hasLintErrors, handleConfigureConnection, handleOpenLintingPanel ]);

  return <div className={ css.TaskTestingTab }>
    <TaskTesting
      injector={ injector }
      config={ taskTestingConfig }
      hasError={ hasError }
      onConfigChanged={ setTaskTestingConfig }
      operateBaseUrl={ operateUrl }
      tasklistBaseUrl={ tasklistUrl }
      onTaskExecutionStarted={ handleTaskExecutionStarted }
      onTaskExecutionFinished={ handleTaskExecutionFinished }
      onTestTask={ handleTestTask }
      errorBannerTitle={ errorTitle }
      errorBannerDescription={ errorDescription }
      configureTooltip={ errorDescription }
      errorBannerActionLabel={ errorActionLabel }
      onConfigure={ handleConfigure }
      api={ api }
      documentationUrl={ DOCUMENTATION_URL }
    />
  </div>;
}

function getErrorTitle(connectionCheckResult, hasLintingErrors) {
  if (!connectionCheckResult) {
    return hasLintingErrors ? LINTING_ERRORS_TITLE : null;
  } else if (!connectionCheckResult.success) {
    return CANNOT_CONNECT_TITLE;
  } else if (!isProtocolSupported(connectionCheckResult)) {
    return UNSUPPORTED_PROTOCOL_TITLE;
  } else if (!isExecutionPlatformVersionSupported(connectionCheckResult)) {
    return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE;
  } else if (hasLintingErrors) {
    return LINTING_ERRORS_TITLE;
  }
  return null;
}

function getErrorDescription(connectionCheckResult, hasLintingErrors) {
  if (!connectionCheckResult) {
    return hasLintingErrors ? LINTING_ERRORS_DESCRIPTION : DEFAULT_CONFIGURE_DESCRIPTION;
  } else if (!connectionCheckResult.success) {
    return CANNOT_CONNECT_DESCRIPTION;
  } else if (!isProtocolSupported(connectionCheckResult)) {
    return UNSUPPORTED_PROTOCOL_DESCRIPTION;
  } else if (!isExecutionPlatformVersionSupported(connectionCheckResult)) {
    return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION;
  } else if (hasLintingErrors) {
    return LINTING_ERRORS_DESCRIPTION;
  }
  return DEFAULT_CONFIGURE_DESCRIPTION;
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
