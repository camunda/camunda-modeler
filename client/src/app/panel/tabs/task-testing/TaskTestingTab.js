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

export const REQUIRED_CAMUNDA_CLOUD_VERSION = '8.8.0';

const CONNECTION_INVALID_TITLE = 'Couldn\'t connect to Camunda';
const CONNECTION_INVALID_DESCRIPTION = 'Configure a REST connection to Camunda 8 cluster.';

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
  const [ isConnectionConfigured, setIsConnectionConfigured ] = useState(false);

  const operateUrl = useMemo(() => {
    if (!isConnectionConfigured) {
      return null;
    }

    return taskTestingApi.getOperateUrl();
  }, [ isConnectionConfigured, taskTestingApi ]);

  const isSupportedByRuntime = useMemo(() => {
    return engineProfile &&
      engineProfile.executionPlatform === ENGINES.CLOUD &&
      semverCompare(engineProfile.executionPlatformVersion || '0', REQUIRED_CAMUNDA_CLOUD_VERSION) >= 0;
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

  const checkConnection = async ({ success }) => {

    // file is not saved
    if (!file?.path) {
      return;
    }

    const config = await taskTestingApi.getDeploymentConfig();
    connectionChecker.updateConfig(config);

    setIsConnectionConfigured(success);
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

  const handleMissingDeploymentConfig = () => {
    onAction('open-deployment');
  };

  return <>
    <Fill slot="bottom-panel"
      id="task-testing"
      label="Test"
      layout={ layout }
      priority={ 6 }>
      <div className={ css.TaskTestingTab }>
        { isSupportedByRuntime ?
          <TaskTesting
            injector={ injector }
            config={ taskTestingConfig }
            isConnectionConfigured={ isConnectionConfigured }
            onConfigureConnection={ handleMissingDeploymentConfig }
            onConfigChanged={ setTaskTestingConfig }
            operateBaseUrl={ operateUrl }
            onTaskExecutionStarted={ handleTaskExecutionStarted }
            onTaskExecutionFinished={ handleTaskExecutionFinished }
            onTaskExecutionInterrupted={ handleTaskExecutionInterrupted }
            configureConnectionBannerTitle={ CONNECTION_INVALID_TITLE }
            configureConnectionBannerDescription={ CONNECTION_INVALID_DESCRIPTION }
            api={ taskTestingApi.getApi() }
          />
          :
          <div className="unsupported">
            <p>Task testing is not supported by the current engine version.</p>
            <p>Please use Camunda 8.8 or later.</p>
          </div>
        }
      </div>
    </Fill>
    <TestStatusBarItem
      injector={ injector }
      layout={ layout }
      onToggle={ onToggle } />
  </>;
}