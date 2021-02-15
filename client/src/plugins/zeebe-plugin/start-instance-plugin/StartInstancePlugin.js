/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import { Fill } from '../../../app/slot-fill';

import PlayIcon from 'icons/Play.svg';

import { Button } from '../../../shared/ui';

import css from './StartInstancePlugin.less';

import pDefer from 'p-defer';


export default class StartInstancePlugin extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      activeTab: null
    };
  }

  componentDidMount() {
    this.props.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({
        activeTab
      });
    });
  }


  async startInstance() {
    const { deploymentResult, endpoint } = await this.deployActiveTab();

    // cancel on deployment error or deployment cancelled
    if (!deploymentResult || !deploymentResult.success) {
      return;
    }

    return this.startProcessInstance(
      deploymentResult.response.workflows[0].bpmnProcessId, endpoint);
  }

  startProcessInstance = async (processId, endpoint) => {
    const {
      _getGlobal
    } = this.props;

    const zeebeAPI = _getGlobal('zeebeAPI');

    await zeebeAPI.run({ processId, endpoint });

    this.props.displayNotification({
      type: 'success',
      title: 'Process instance deployed and started successfully',
      duration: 10000
    });
  }

  onIconClicked = async () => {
    this.startInstance();
  }

  deployActiveTab() {
    const deferred = pDefer();
    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: deferred.resolve
    };

    this.props.broadcastMessage('deploy', body);

    return deferred.promise;
  }

  render() {

    const {
      activeTab
    } = this.state;

    return <React.Fragment>
      {
        isZeebeTab(activeTab) &&
        <Fill slot="toolbar" group="8_deploy" priority={ 0 }>
          <Button
            onClick={ this.onIconClicked }
            title="Start Current Diagram"
            className={ css.StartInstancePlugin }
          >
            <PlayIcon className="icon" />
          </Button>
        </Fill>
      }
    </React.Fragment>;
  }
}


// helpers ////////////////////

function isZeebeTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}
