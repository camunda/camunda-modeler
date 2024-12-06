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

import * as css from './StartInstancePlugin.less';

import pDefer from 'p-defer';
import classNames from 'classnames';
import { CAMUNDA_CLOUD } from '../shared/ZeebeTargetTypes';
import StartInstanceConfigOverlay from './StartInstanceConfigOverlay';
import { getClusterUrl } from '../shared/util';

const DEFAULT_CONFIGURATION = { variables: '' };


export default class StartInstancePlugin extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      activeTab: null,
      activeButton: false,
      overlayState: null
    };

    this._anchorRef = React.createRef();
  }

  componentDidMount() {
    this.props.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({
        activeTab,
        overlayState: null,
        activeButton: false
      });
    });
  }

  async startInstance() {
    const {
      activeTab,
    } = this.state;

    // (1) toggle overlay
    if (this.toggleOverlay()) {
      return;
    }

    this.setState({ activeButton: true });

    // (2) get deploy configuration

    // (2.1) get deployment configuration
    const deploymentConfig = await this.getDeployConfig();

    // (2.1) user cancelled
    if (!deploymentConfig) {
      this.setState({ activeButton: false });
      return;
    }

    // (3) get start instance configuration

    // (3.1) get start configuration
    const startConfiguration = await this.getSavedConfiguration(activeTab, 'start-process-instance');

    // (3.2) get configuration from user
    this.setState({ activeButton: true });

    const {
      action,
      configuration : startInstanceConfig
    } = await this.getConfigurationFromUser(startConfiguration);

    // (3.3) handle user cancellation
    if (action === 'cancel') {
      this.setState({ activeButton: false });
      return;
    }

    this.saveConfiguration(activeTab, 'start-process-instance', startInstanceConfig);

    // (4) trigger start instance
    await this.startInstanceProcess(deploymentConfig, startInstanceConfig);
  }

  async getConfigurationFromUser(startConfiguration) {
    const configuration = startConfiguration || DEFAULT_CONFIGURATION;

    return new Promise(resolve => {
      const onClose = (action, configuration) => {
        this.setState({
          overlayState: null,
          activeButton: false
        });

        // contract: if configuration provided, user closed with O.K.
        // otherwise they canceled it
        return resolve({ action, configuration });
      };

      this.setState({
        overlayState: {
          isStart: true,
          configuration,
          onClose
        }
      });
    });
  }

  async startInstanceProcess(deploymentConfig, startInstanceConfig) {

    // (1) deploy with deployment config
    const { deploymentResult, endpoint } = await this.deployWithConfig(deploymentConfig);

    // (1.1) cancel on deployment cancelled
    if (!deploymentResult || !deploymentResult.success) {
      return;
    }

    // (2) set status-bar button as inactive and close overlay
    this.setState({
      activeButton: false,
      overlayState: null
    });

    // (3) start process instance
    const {
      _getGlobal
    } = this.props;

    const zeebeAPI = _getGlobal('zeebeAPI');
    const processId = deploymentResult.response.deployments[0].process.bpmnProcessId;

    const decoratedConfig = this.decorateVariables(startInstanceConfig);

    try {

      // (3.1) trigger run
      const startInstanceResult = await zeebeAPI.run({
        processId,
        tenantId: deploymentConfig.config.deployment.tenantId,
        endpoint,
        ...decoratedConfig
      });

      // (3.1.1) handle start instance error
      if (!startInstanceResult.success) {
        this.handleStartError(startInstanceResult.response);
        return;
      }

      // (3.1.2) handle start instance success
      this.handleStartSuccess(startInstanceResult, endpoint);

    } catch (error) {

      // (3.1.3) handle start instance exception
      this.handleStartError(error);
    }
  }

  decorateVariables = (startConfiguration) => {
    let {
      variables
    } = startConfiguration;

    if (variables && variables.trim().length > 0) {
      variables = JSON.parse(variables);
    } else {
      variables = null;
    }

    return { ...startConfiguration, variables };
  };

  async getDeployConfig() {
    const deferred = pDefer();
    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: deferred.resolve,
      anchorRef: this._anchorRef,
      notifyResult: true,
      onClose: () => {
        this.setState({
          activeButton: false
        });
      }
    };

    this.props.broadcastMessage('getDeployConfig', body);

    return deferred.promise;
  }

  async deployWithConfig(deploymentConfig) {
    const deferred = pDefer();
    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: deferred.resolve,
      anchorRef: this._anchorRef,
      tab: this.state.activeTab,
      deploymentConfig
    };

    this.props.broadcastMessage('deployWithConfig', body);

    return deferred.promise;
  }

  handleStartSuccess(processInstance, endpoint) {
    const {
      displayNotification
    } = this.props;

    const content = endpoint.targetType === CAMUNDA_CLOUD ?
      <CloudLink endpoint={ endpoint } response={ processInstance.response } />
      : null;

    displayNotification({
      type: 'success',
      title: 'Process instance started',
      content: content,
      duration: 8000
    });
  }

  handleStartError(error) {
    const {
      log,
      displayNotification
    } = this.props;

    const logMessage = {
      category: 'start-instance-error',
      message: error.details || error.message
    };

    const content = <button
      onClick={ ()=> log(logMessage) }>
      See the log for further details.
    </button>;

    displayNotification({
      type: 'error',
      title: 'Starting process instance failed',
      content: content,
      duration: 4000
    });
  }

  async getSavedConfiguration(tab, key) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, key);
  }

  async saveConfiguration(tab, key, configuration) {
    const {
      config
    } = this.props;

    await config.setForFile(tab.file, key, configuration);

    return configuration;
  }

  toggleOverlay() {
    const {
      activeButton,
      overlayState
    } = this.state;

    // (1) toggle overlay
    if (overlayState) {

      // (1.1) close start instance overlay
      overlayState.onClose('cancel', null);
      return true;

    } else if (!overlayState && activeButton) {

      // (1.2) close deploy overlay
      this.props.broadcastMessage('cancel');
      return true;
    }
  }


  render() {

    const {
      activeTab,
      overlayState
    } = this.state;

    return <React.Fragment>
      {
        isZeebeTab(activeTab) &&
        <Fill slot="status-bar__file" group="8_deploy" priority={ 0 }>
          <button
            className={ classNames(css.StartInstancePlugin, 'btn', { 'btn--active': this.state.activeButton }) }
            onClick={ this.startInstance.bind(this) }
            ref={ this._anchorRef }
            type="button"
            title="Start current diagram"
          >
            <PlayIcon
              className="icon" />
          </button>
        </Fill>
      }

      {overlayState && overlayState.isStart &&
      <StartInstanceConfigOverlay
        anchor={ this._anchorRef.current }
        onSubmit={ overlayState.onClose }
        onClose={ overlayState.onClose }
        configuration={ overlayState.configuration }
      />}
    </React.Fragment>;
  }
}

function CloudLink(props) {
  const {
    endpoint,
    response
  } = props;

  const {
    processInstanceKey
  } = response;

  const clusterUrl = getClusterUrl(endpoint);
  const url = `${clusterUrl}/processes/${processInstanceKey}`;

  return (
    <div className={ css.CloudLink }>
      <div>
        Process Instance ID:
        <code>{processInstanceKey}</code>
      </div>
      <a href={ url }>
        Open in Camunda Operate
      </a>
    </div>
  );
}


// helpers ////////////////////

function isZeebeTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}
