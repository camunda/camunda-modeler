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

import semver from 'semver';

import TaskTesting from '@camunda/task-testing';

import { Fill } from '../../../slot-fill';

import { debounce } from '../../../../util';

import ZeebeAPI from '../../../../remote/ZeebeAPI';

import ConnectionChecker from '../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

import TaskTestingStatusBarItem from './TaskTestingStatusBarItem';
import TaskTestingApi from './TaskTestingApi';

import * as css from './TaskTestingTab.less';

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

export default function TaskTestingTab(props) {
  const {
    backend,
    config,
    injector,
    file,
    layout = {},
    onAction
  } = props;

  const [ taskTestingConfig, setTaskTestingConfig ] = useState(DEFAULT_CONFIG);

  const { current: zeebeApi } = useRef(new ZeebeAPI(backend));
  const { current: taskTestingApi } = useRef(new TaskTestingApi(zeebeApi, config, file, onAction));
  const { current: connectionChecker } = useRef(new ConnectionChecker(zeebeApi));

  const [ connectionCheckResult, setConnectionCheckResult ] = useState(false);

  const [ operateUrl, setOperateUrl ] = useState(null);

  useEffect(() => {
    if (connectionCheckResult) {
      taskTestingApi.getOperateUrl().then(setOperateUrl);
    }
  }, [ connectionCheckResult, taskTestingApi ]);

  const onConnectionCheck = async ({ success, response }) => {

    // file is not saved
    if (!file?.path) {
      return;
    }

    const config = await taskTestingApi.getDeploymentConfig();

    connectionChecker.updateConfig(config);

    setConnectionCheckResult({ success, response });
  };

  useConnectionChecker(connectionChecker, onConnectionCheck);

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
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== TAB_ID) {
      onAction('open-panel', { tab: TAB_ID });
    } else if (panel.tab === TAB_ID) {
      onAction('close-panel');
    }
  };

  const handleTaskExecutionStarted = (element) => {
    onAction('emit-event', {
      type: 'taskTesting.started',
      payload: {
        element
      }
    });
  };

  const handleTaskExecutionFinished = (element, output) => {
    onAction('emit-event', {
      type: 'taskTesting.finished',
      payload: {
        element,
        output
      }
    });
  };

  const handleTaskExecutionInterrupted = () => {
    onAction('display-notification', {
      type: 'warning',
      title: 'Task testing canceled',
    });
  };

  const handleConfigureConnection = () => {
    onAction('open-deployment');
  };

  const configureConnectionBannerTitle = getConnectionBannerTitle(connectionCheckResult);
  const configureConnectionBannerDescription = getConfigureConnectionBannerDescription(connectionCheckResult);

  return <>
    <Fill slot="bottom-panel"
      id="task-testing"
      label="Task testing"
      layout={ layout }
      priority={ 6 }>
      <div className={ css.TaskTestingTab }>
        <TaskTesting
          injector={ injector }
          config={ taskTestingConfig }
          isConnectionConfigured={ canConnectToCluster(connectionCheckResult) }
          onConfigureConnection={ handleConfigureConnection }
          onConfigChanged={ setTaskTestingConfig }
          operateBaseUrl={ operateUrl }
          onTaskExecutionStarted={ handleTaskExecutionStarted }
          onTaskExecutionFinished={ handleTaskExecutionFinished }
          onTaskExecutionInterrupted={ handleTaskExecutionInterrupted }
          configureConnectionBannerTitle={ configureConnectionBannerTitle }
          configureConnectionBannerDescription={ configureConnectionBannerDescription }
          api={ taskTestingApi.getApi() }
          documentationUrl={ 'https://docs.camunda.com/docs/components/modeler/desktop-modeler/task-testing/' }
        />
      </div>
    </Fill>
    <TaskTestingStatusBarItem
      injector={ injector }
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

function useConnectionChecker(connectionChecker, onConnectionCheck) {
  useEffect(() => {
    connectionChecker.on('connectionCheck', onConnectionCheck);
    connectionChecker.startChecking();

    return () => {
      connectionChecker.stopChecking();
      connectionChecker.off('connectionCheck', onConnectionCheck);
    };
  }, [ connectionChecker ]);
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