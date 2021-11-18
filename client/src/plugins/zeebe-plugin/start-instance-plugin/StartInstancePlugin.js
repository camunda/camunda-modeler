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

import css from './StartInstancePlugin.less';

import pDefer from 'p-defer';
import classNames from 'classnames';
import { OverlayDropdown } from '../../../shared/ui';


export default class StartInstancePlugin extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      activeTab: null,
      openOverlay: false,
      activeButton: false
    };

    this._items = [
      { text: 'Start process instance', onClick: () => this.startInstance() }
    ];

    this._anchorRef = React.createRef();
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

  onOverlayClose = async () => {
    this.props.broadcastMessage('cancel');
    this.setState({ activeButton: false });
  }

  deployActiveTab() {
    const deferred = pDefer();
    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: deferred.resolve,
      anchorRef: this._anchorRef,
      onClose: () => { this.setState({ activeButton: false }); }
    };

    this.setState({ activeButton: true });

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
        <Fill slot="status-bar__file" group="8_deploy" priority={ 0 }>
          <OverlayDropdown
            items={ this._items }
            title="Start Current Diagram"
            buttonRef={ this._anchorRef }
            className={ classNames(css.StartInstancePlugin, { 'btn--active': this.state.activeButton }) }
            overlayState={ this.state.activeButton }
            onClose={ this.onOverlayClose }
          >
            <PlayIcon className="icon" />
          </OverlayDropdown>
        </Fill>
      }
    </React.Fragment>;
  }
}


// helpers ////////////////////

function isZeebeTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}
