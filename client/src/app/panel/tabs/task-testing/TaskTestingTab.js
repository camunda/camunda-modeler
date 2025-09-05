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
import Deployment from '../../../../plugins/zeebe-plugin/deployment-plugin/Deployment';
import StartInstance from '../../../../plugins/zeebe-plugin/start-instance-plugin/StartInstance';

import ConnectionChecker from '../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

import TestStatusBarItem from './TestStatusBarItem';

import * as css from './TaskTestingTab.less';

export const TAB_ID = 'task-testing';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

export const REQUIRED_CAMUNDA_CLOUD_VERSION = '8.8.0';

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

  const [ isConnectionConfigured, setIsConnectionConfigured ] = useState(false);

  const [ zeebeAPI ] = useState(new ZeebeAPI(backend));
  const [ deployment ] = useState(new Deployment(config, zeebeAPI));
  const [ startInstance ] = useState(new StartInstance(config, zeebeAPI));

  const [ connectionChecker ] = useState(new ConnectionChecker(zeebeAPI));

  const isSupportedByRuntime = useMemo(() => {
    return engineProfile &&
      engineProfile.executionPlatform === ENGINES.CLOUD &&
      semverCompare(engineProfile.executionPlatformVersion || '0', REQUIRED_CAMUNDA_CLOUD_VERSION) >= 0;
  }, [ engineProfile ]);

  useEffect(() => {

    // file is not saved
    if (!file?.path) {
      return;
    }

    const updateConfig = async () => {
      const config = await deployment.getConfigForFile(file);
      connectionChecker.updateConfig(config);
    };

    const checkConnection = async ({ success }) => {
      await updateConfig();
      setIsConnectionConfigured(success);
    };

    updateConfig();
    connectionChecker.on('connectionCheck', checkConnection);

    return () => {
      connectionChecker.off('connectionCheck', checkConnection);
    };
  }, [ connectionChecker, file ]);

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

  const handleDeployment = async () => {
    const config = await deployment.getConfigForFile(file);

    onAction('save');

    return deployment.deploy([
      {
        path: file.path,
        type: 'bpmn'
      }
    ], config);
  };

  const handleMissingDeploymentConfig = () => {
    onAction('open-deployment');
  };

  const handleStartInstance = async (processId, elementId, variables) => {
    const config = await deployment.getConfigForFile(file);

    return startInstance.startInstance(processId, {
      ...config,
      variables,
      startInstructions:[
        {
          elementId
        }
      ],
      runtimeInstructions: [
        {
          type: 'TERMINATE_PROCESS_INSTANCE',
          afterElementId: elementId
        }
      ]
    });
  };

  const getProcessInstance = async (processInstanceKey) => {
    const config = await deployment.getConfigForFile(file);

    return zeebeAPI.searchProcessInstances(config, processInstanceKey);
  };

  const getProcessInstanceVariables = async (processInstanceKey) => {
    const config = await deployment.getConfigForFile(file);

    return zeebeAPI.searchVariables(config, processInstanceKey);
  };

  const getProcessInstanceIncident = async (processInstanceKey) => {
    const config = await deployment.getConfigForFile(file);

    return zeebeAPI.searchIncidents(config, processInstanceKey);
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
            api={ {
              deploy: handleDeployment,
              startInstance: handleStartInstance,
              getProcessInstance: getProcessInstance,
              getProcessInstanceVariables: getProcessInstanceVariables,
              getProcessInstanceIncident: getProcessInstanceIncident
            } }
          />
          :
          <div className="unsupported">
            <p>Task testing is not supported by the current engine version.</p>
            <p>Please use Camunda Cloud 8.7.0 or later.</p>
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