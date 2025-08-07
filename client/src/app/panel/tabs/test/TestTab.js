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

import TestStatusBarItem from './TestStatusBarItem';

import ZeebeAPI from '../../../../remote/ZeebeAPI';

import {
  bootstrapDeployment,
  bootstrapStartInstance,
  getProcessId
} from '../../../../plugins/zeebe-plugin/shared/util';

export default function TestTab(props) {
  const {
    layout,
    onAction,
    backend,
    config,
    file,
    injector,
    engineProfile
  } = props;

  const [ zeebeClient, setZeebeClient ] = useState(null);
  const [ deployment, setDeployment ] = useState(null);

  useEffect(() => {
    if (zeebeClient) {
      return;
    }

    const zeebeAPI = new ZeebeAPI(backend);
    setZeebeClient(zeebeAPI);

    const { deployment } = bootstrapDeployment(backend, config);
    setDeployment(deployment);
  }, []);

  const supportedByRuntime = useMemo(() => {
    return engineProfile &&
      engineProfile.executionPlatform === ENGINES.CLOUD &&
      engineProfile.executionPlatformVersion > '8.6.0';
  }, [ engineProfile ]);


  const handleToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== 'test') {
      onAction('open-panel', { tab: 'test' });
    } else if (panel.tab === 'test') {
      onAction('close-panel');
    }
  };

  const deploy = async () => {

    const deploymentConfig = await deployment.getConfigForFile(file);

    // TODO: Validate deploymentConfig
    const deploymentResponse = await deployment.deploy({
      path: file.path,
      type: 'bpmn',
    }, deploymentConfig);

    return deploymentResponse;
  };

  const startInstance = async (deploymentResponse, variables, elementId) => {

    const processId = getProcessId(deploymentResponse, file.name);

    const { startInstance } = bootstrapStartInstance(backend, config);

    const deploymentConfig = await deployment.getConfigForFile(file);

    const startInstanceResult = await startInstance.startInstance(processId, {
      ...deploymentConfig,
      variables,
      startInstructions: [
        {
          elementId
        }
      ],
      withResult: false // withResult does not support start instructions
    });

    return startInstanceResult;
  };

  const getInstance = async (processInstanceKey) => {

    const deploymentConfig = await deployment.getConfigForFile(file);

    const getProcessInstanceResult = await zeebeClient.getProcessInstance(deploymentConfig.endpoint, processInstanceKey);
    return getProcessInstanceResult;
  };

  return <>
    <Fill slot="bottom-panel"
      id="test"
      label="Test"
      layout={ layout }
      priority={ 4 }>
      {!supportedByRuntime && <div style={ { padding: 10 } }>
        <p>
          Task testing is not supported by the current engine version.
          <br />
          Please use Camunda Cloud 8.7.0 or later.
        </p>
      </div>}
      {supportedByRuntime && <TaskTesting
          deploy={ deploy }
          startInstance={ startInstance }
          getInstance={ getInstance }
          saveFile={ handleSave }
          injector={ injector } />
      </div>
    </Fill>
    <TestStatusBarItem
      layout={ layout }
      onToggle={ handleToggle } />
  </>;
}