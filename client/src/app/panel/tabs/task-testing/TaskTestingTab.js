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

import TaskTesting from 'task-testing';

import { Fill } from '../../../slot-fill';

import ZeebeAPI from '../../../../remote/ZeebeAPI';
import Deployment from '../../../../plugins/zeebe-plugin/deployment-plugin/Deployment';
import StartInstance from '../../../../plugins/zeebe-plugin/start-instance-plugin/StartInstance';

import * as css from './TaskTestingTab.less';

import TestStatusBarItem from './TestStatusBarItem';

import { debounce } from '../../../../util';

import { ENGINES } from '../../../../util/Engines';

export const TAB_ID = 'task-testing';

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

  const [ taskTestingConfig, setTaskTestingConfig ] = useState();

  const [ saveConfigDebounced ] = useState(() => debounce((config, newConfig) => {
    console.log('Saving task testing config after debounce:', newConfig);

    config.set('taskTesting', newConfig).catch((err) => {
      console.error('Failed to save task testing config:', err);
    });
  }));

  const [ canExecuteTask, setCanExecuteTask ] = useState(false);

  const [ zeebeAPI ] = useState(new ZeebeAPI(backend));
  const [ deployment ] = useState(new Deployment(config, zeebeAPI));
  const [ startInstance ] = useState(new StartInstance(config, zeebeAPI));

  const supportedByRuntime = useMemo(() => {
    return engineProfile &&
      engineProfile.executionPlatform === ENGINES.CLOUD &&
      engineProfile.executionPlatformVersion > '8.6.0';
  }, [ engineProfile ]);

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== TAB_ID) {
      onAction('open-panel', { tab: TAB_ID });
    } else if (panel.tab === TAB_ID) {
      onAction('close-panel');
    }
  };

  useEffect(() => {
    deployment.getConfigForFile(file).then((config) => {
      setCanExecuteTask(!!config);
    });
  }, []);

  useEffect(() => {
    config.get('taskTesting', {
      input: {},
      output: {}
    }).then((taskTestingConfig) => {
      console.log('Loaded task testing config:', taskTestingConfig);

      setTaskTestingConfig(taskTestingConfig);
    }).catch((err) => {
      console.error('Failed to load task testing config:', err);
    });
  }, [ config ]);

  const onConfigChanged = (newConfig) => {
    console.log('Task testing config changed:', newConfig);
    setTaskTestingConfig(newConfig);

    saveConfigDebounced(config, newConfig);
  };

  const onDeploy = async () => {
    const config = await deployment.getConfigForFile(file);

    return deployment.deploy([
      {
        path: file.path,
        type: 'bpmn'
      }
    ], config);
  };

  const onStartInstance = async (processId, elementId, variables) => {
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

  const onGetProcessInstance = async (processInstanceKey) => {
    const config = await deployment.getConfigForFile(file);

    return zeebeAPI.searchProcessInstances(config, processInstanceKey);
  };

  const onGetProcessInstanceVariables = async (processInstanceKey) => {
    const config = await deployment.getConfigForFile(file);

    return zeebeAPI.searchVariables(config, processInstanceKey);
  };

  const onGetProcessInstanceIncident = async (processInstanceKey) => {
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
        { supportedByRuntime ?
          <TaskTesting
            canExecuteTask={ canExecuteTask }
            config={ taskTestingConfig }
            injector={ injector }
            onConfigChanged={ onConfigChanged }
            api={ {
              deploy: onDeploy,
              startInstance: onStartInstance,
              getProcessInstance: onGetProcessInstance,
              getProcessInstanceVariables: onGetProcessInstanceVariables,
              getProcessInstanceIncident: onGetProcessInstanceIncident
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