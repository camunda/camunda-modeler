/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useState } from 'react';

import semverCompare from 'semver-compare';

import TaskTesting from '@camunda/task-testing';

import { Fill } from '../../../slot-fill';

import { debounce } from '../../../../util';

import { ENGINES } from '../../../../util/Engines';

import ZeebeAPI from '../../../../remote/ZeebeAPI';

import ConnectionChecker from '../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

import TestStatusBarItem from './TestStatusBarItem';
import TaskTestingApi from './TaskTestingApi';

import * as css from './TaskTestingTab.less';

export const TAB_ID = 'task-testing';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

export const MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION = '8.8.0';
export const SUPPORTED_PROTOCOL = 'rest';

const CANNOT_CONNECT_TITLE = 'Couldn\'t connect to Camunda';
const CANNOT_CONNECT_DESCRIPTION = 'Configure a REST connection to a Camunda 8 cluster.';

const UNSUPPORTED_PROTOCOL_TITLE = 'REST connection required';
const UNSUPPORTED_PROTOCOL_DESCRIPTION = 'Task testing requires a REST connection to a Camunda 8 cluster. The current connection uses gRPC.';

const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE = 'Execution platform version not supported';
const UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION = `Task testing requires Camunda ${MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION} or higher`;

export default function TaskTestingTab(props) {
  const {
    backend,
    config,
    engineProfile,
    injector,
    file,
    layout = {},
    onAction
  } = props;

  const [ taskTestingConfig, setTaskTestingConfig ] = useState(DEFAULT_CONFIG);

  const [ zeebeApi ] = useState(new ZeebeAPI(backend));
  const [ taskTestingApi ] = useState(new TaskTestingApi(zeebeApi, config, file, onAction));

  const [ connectionChecker ] = useState(new ConnectionChecker(zeebeApi));
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(false);

  const operateUrl = useMemo(() => {
    if (!connectionCheckResult) {
      return null;
    }

    return taskTestingApi.getOperateUrl();
  }, [ connectionCheckResult, taskTestingApi ]);

  const isExecutionPlatformVersionSupported = useMemo(() => {
    return engineProfile &&
      engineProfile.executionPlatform === ENGINES.CLOUD &&
      semverCompare(engineProfile.executionPlatformVersion || '0', MIN_SUPPORTED_EXECUTION_PLATFORM_VERSION) >= 0;
  }, [ engineProfile ]);

  useEffect(() => {
    connectionChecker.on('connectionCheck', checkConnection);
    connectionChecker.startChecking();

    return () => {
      connectionChecker.stopChecking();
      connectionChecker.off('connectionCheck', checkConnection);
    };
  }, [ connectionChecker ]);

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
  }, [ taskTestingConfig ]);

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== TAB_ID) {
      onAction('open-panel', { tab: TAB_ID });
    } else if (panel.tab === TAB_ID) {
      onAction('close-panel');
    }
  };

  const checkConnection = async ({ success, protocol }) => {

    // file is not saved
    if (!file?.path) {
      return;
    }

    const config = await taskTestingApi.getDeploymentConfig();

    connectionChecker.updateConfig(config);

    setConnectionCheckResult({ success, protocol });
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
    if (!connectionCheckResult || !connectionCheckResult.success || connectionCheckResult.protocol !== SUPPORTED_PROTOCOL) {
      onAction('open-deployment');
    } else if (!isExecutionPlatformVersionSupported) {
      onAction('open-engine-profile');
    }
  };

  const configureConnectionBannerTitle = useMemo(() => {
    if (!connectionCheckResult || !connectionCheckResult.success) {
      return CANNOT_CONNECT_TITLE;
    } else if (connectionCheckResult.protocol !== SUPPORTED_PROTOCOL) {
      return UNSUPPORTED_PROTOCOL_TITLE;
    } else if (!isExecutionPlatformVersionSupported) {
      return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE;
    }
    return null;
  }, [ connectionCheckResult, isExecutionPlatformVersionSupported ]);

  const configureConnectionBannerDescription = useMemo(() => {
    if (!connectionCheckResult || !connectionCheckResult.success) {
      return CANNOT_CONNECT_DESCRIPTION;
    } else if (connectionCheckResult.protocol !== SUPPORTED_PROTOCOL) {
      return UNSUPPORTED_PROTOCOL_DESCRIPTION;
    } else if (!isExecutionPlatformVersionSupported) {
      return UNSUPPORTED_EXECUTION_PLATFORM_VERSION_DESCRIPTION;
    }
    return null;
  }, [ connectionCheckResult, isExecutionPlatformVersionSupported ]);

  const isConnectionConfigured = connectionCheckResult
    && connectionCheckResult.success
    && connectionCheckResult.protocol === SUPPORTED_PROTOCOL
    && isExecutionPlatformVersionSupported;

  return <>
    <Fill slot="bottom-panel"
      id="task-testing"
      label="Test"
      layout={ layout }
      priority={ 6 }>
      <div className={ css.TaskTestingTab }>
        <TaskTesting
          injector={ injector }
          config={ taskTestingConfig }
          isConnectionConfigured={ isConnectionConfigured }
          onConfigureConnection={ handleConfigureConnection }
          onConfigChanged={ setTaskTestingConfig }
          operateBaseUrl={ operateUrl }
          onTaskExecutionStarted={ handleTaskExecutionStarted }
          onTaskExecutionFinished={ handleTaskExecutionFinished }
          onTaskExecutionInterrupted={ handleTaskExecutionInterrupted }
          configureConnectionBannerTitle={ configureConnectionBannerTitle }
          configureConnectionBannerDescription={ configureConnectionBannerDescription }
          api={ taskTestingApi.getApi() }
        />
      </div>
    </Fill>
    <TestStatusBarItem
      injector={ injector }
      layout={ layout }
      onToggle={ onToggle } />
  </>;
}