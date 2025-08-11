/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import TaskTesting from 'task-testing';

import { Fill } from '../../../slot-fill';

import ZeebeAPI from '../../../../remote/ZeebeAPI';
import Deployment from '../../../../plugins/zeebe-plugin/deployment-plugin/Deployment';
import StartInstance from '../../../../plugins/zeebe-plugin/start-instance-plugin/StartInstance';

import * as css from './TaskTestingTab.less';

import TestStatusBarItem from './TestStatusBarItem';

export const TAB_ID = 'task-testing';

export default function TestTab(props) {
  const {
    backend,
    config,
    injector,
    file,
    layout = {},
    onAction
  } = props;

  const [ zeebeAPI, setZeebeAPI ] = useState(new ZeebeAPI(backend));

  const [ deployment, setDeployment ] = useState(new Deployment(config, zeebeAPI));
  const [ startInstance, setStartInstance ] = useState(new StartInstance(config, zeebeAPI));

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== TAB_ID) {
      onAction('open-panel', { tab: TAB_ID });
    } else if (panel.tab === TAB_ID) {
      onAction('close-panel');
    }
  };

  const [ taskTestingConfig, setTaskTestingConfig ] = useState({
    input: {},
    output: {}
  });

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

  const onSaveTaskTestingConfig = (newConfig) => {
    console.log('Saving task testing config:', newConfig);

    config.set('taskTesting', newConfig).then(() => {
      setTaskTestingConfig(newConfig);
    }).catch((err) => {
      console.error('Failed to save task testing config:', err);
    });
  };

  const onDeploy = async () => {
    debugger;
    const config = await deployment.getConfigForFile(file);

    return deployment.deploy([
      {
        path: file.path,
        type: 'bpmn'
      }
    ], config);
  };

  const onStartInstance = async (processId, variables, startInstructions, runtimeInstructions) => {
    debugger;
    const config = await deployment.getConfigForFile(file);

    return await this._zeebeAPI.startInstance(processId, {
      ...config,
      variables,
      startInstructions,
      runtimeInstructions
    });
  };

  const onGetInstance = () => {};
  const onGetIncidents = () => {};

  return <>
    <Fill slot="bottom-panel"
      id="task-testing"
      label="Test"
      layout={ layout }
      priority={ 6 }>
      <div className={ css.TaskTestingTab }>
        {
          zeebeAPI && <TaskTesting
            config={ taskTestingConfig }
            injector={ injector }
            operateAPI={ null } // TODO: Implement Operate API
            saveConfig={ onSaveTaskTestingConfig }
            zeebeAPI={ {
              deploy: onDeploy,
              startInstance: onStartInstance
            } }
          />
        }
      </div>
    </Fill>
    <TestStatusBarItem
      injector={ injector }
      layout={ layout }
      onToggle={ onToggle } />
  </>;
}