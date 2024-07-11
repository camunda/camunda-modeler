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

import PlayIcon from 'icons/Play.svg';

import CamundaAPI, { DeploymentError, StartInstanceError } from '../shared/CamundaAPI';
import { ConnectionError } from '../shared/RestAPI';

import StartInstanceConfigOverlay from './StartInstanceConfigOverlay';

import CockpitProcessInstanceLink from '../shared/ui/CockpitProcessInstanceLink';

import * as css from './StartInstanceTool.less';

import { Fill } from '../../../app/slot-fill';

import { OverlayDropdown } from '../../../shared/ui';

import isExecutable from './util/isExecutable';

import { ENGINES } from '../../../util/Engines';
import classNames from 'classnames';
import { determineCockpitUrl } from '../shared/webAppUrls';

const START_DETAILS_CONFIG_KEY = 'start-instance-tool';

const START_INSTANCE_FAILED = 'Starting process instance failed';

const PROCESS_DEFINITION_CONFIG_KEY = 'process-definition';

export default class StartInstanceTool extends PureComponent {

  state = {
    overlayState: null,
    activeTab: null
  };

  START_ACTIONS = [
    {
      text: 'Start process instance',
      onClick: this.startInstance.bind(this)
    },
    {
      text: 'Start process instance with new configuration',
      onClick: this.startInstance.bind(this, { configure: true })
    }
  ];

  anchorRef = React.createRef();

  componentDidMount() {

    const {
      subscribe
    } = this.props;

    subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({
        activeTab,
        overlayState: null,
        activeButton: false
      });
    });

  }

  saveActiveTab() {
    const {
      triggerAction
    } = this.props;

    return triggerAction('save');
  }

  async deploy(tab, configuration) {

    const {
      deployService
    } = this.props;

    return await deployService.deployWithConfiguration(tab, configuration);
  }

  async getVersion(configuration) {

    const {
      deployService
    } = this.props;

    return await deployService.getVersion(configuration);
  }

  async ensureDeployConfig(tab) {

    const {
      deployService
    } = this.props;

    const deployConfig = await deployService.getSavedDeployConfiguration(tab);

    const {
      configuration: userConfiguration,
      action
    } = await deployService.getDeployConfigurationFromUserInput(tab, deployConfig, {
      title: 'Start Process Instance - Step 1 of 2',
      intro: 'Specify deployment details to deploy this diagram to Camunda Platform.',
      primaryAction: 'Next',
      anchor: this.anchorRef
    });

    if (action === 'cancel') {
      this.setState({ activeButton: false });
      return;
    }

    await deployService.saveDeployConfiguration(tab, userConfiguration);

    return userConfiguration;
  }

  async checkConnection(endpoint) {

    const api = new CamundaAPI(endpoint);

    try {
      await api.checkConnection();
    } catch (error) {
      return error;
    }

    return null;
  }

  async startInstance(options = {}) {

    const {
      configure
    } = options;

    const {
      deployService,
      displayNotification
    } = this.props;

    // (1) Make sure active tab is saved
    const tab = await this.saveActiveTab();

    if (!tab) {
      return;
    }

    // (2) Check for executable process
    const hasExecutable = await this.hasExecutableProcess(tab);

    if (!hasExecutable) {

      displayNotification({
        type: 'error',
        title: START_INSTANCE_FAILED,
        content: 'No executable process available.',
        duration: 4000
      });

      return;
    }

    // (3) Ensure deployment config is available
    let deploymentConfig = await deployService.getSavedDeployConfiguration(tab);

    // (3.1) Check connection to engine
    const showDeployConfig = configure || !deploymentConfig ||
       !deployService.canDeployWithConfiguration(deploymentConfig) ||
       await this.checkConnection(deploymentConfig.endpoint);

    if (showDeployConfig) {

      this.setState({ activeButton: true });

      // (3.2) Open Modal to enter deployment configuration
      deploymentConfig = await this.ensureDeployConfig(tab);

      // (3.2.1) Handle user cancelation
      if (!deploymentConfig) {
        return;
      }
    }

    // (4) Get start configuration
    // (4.1) Try to get existing start configuration
    let startConfiguration = await this.getSavedConfiguration(tab);

    // (4.2) Check if configuration is complete
    const showStartConfig =
       configure || !this.canStartWithConfiguration(startConfiguration);

    if (showStartConfig) {

      this.setState({ activeButton: true });

      const uiOptions = {
        title: configure ? 'Start Process Instance - Step 2 of 2' : null,
        anchor: this.anchorRef
      };

      // (4.3) Open Modal to enter start configuration
      const {
        action,
        configuration: userConfiguration
      } = await this.getConfigurationFromUserInput(
        tab,
        startConfiguration,
        uiOptions
      );

      // (4.3.1) Handle user cancelation
      if (action === 'cancel') {
        this.setState({ activeButton: false });
        return;
      }

      startConfiguration = await this.saveConfiguration(tab, userConfiguration);
    }

    // (5) Trigger deployment
    let version;

    try {

      // (5.1) Retrieve version via API
      try {
        version = (await this.getVersion(deploymentConfig)).version;
      } catch (error) {
        if (!(error instanceof ConnectionError)) {
          throw error;
        }
        version = null;
      }

      // (5.2) Deploy via API
      const deployment = await this.deploy(tab, deploymentConfig);

      // (5.3) Handle success or error
      await this.handleDeploymentSuccess(tab, deployment, version);
    } catch (error) {
      if (!(error instanceof DeploymentError)) {
        throw error;
      }

      return await this.handleDeploymentError(tab, error, version);
    }

    // (5.1) Get latest available process definition
    // * current diagram version OR
    // * version before if diagram had no changes
    const processDefinition = await this.getSavedProcessDefinition(tab);

    // (6) Trigger start instance
    try {
      const {
        endpoint
      } = deploymentConfig;

      const processInstance =
         await this.startWithConfiguration(this.decorateVariables(startConfiguration), processDefinition, endpoint);

      await this.handleStartSuccess(processInstance, endpoint);
    } catch (error) {
      if (!(error instanceof StartInstanceError)) {
        throw error;
      }

      await this.handleStartError(tab, error);
    }
  }

  decorateVariables = (startConfiguration) => {
    let variables = startConfiguration.variables;
    if (variables && variables.trim().length > 0) {
      startConfiguration.variables = JSON.parse(variables);
    } else {
      startConfiguration.variables = null;
    }
    return startConfiguration;
  };

  async saveConfiguration(tab, configuration) {
    const {
      config
    } = this.props;

    await config.setForFile(tab.file, START_DETAILS_CONFIG_KEY, configuration);

    return configuration;
  }

  hasExecutableProcess(tab) {
    return isExecutable(tab.file.contents);
  }

  canStartWithConfiguration(configuration) {

    if (!configuration) {
      return false;
    }

    const {
      businessKey
    } = configuration;

    return !!businessKey;
  }

  async getDefaultConfiguration(providedConfiguration = {}) {

    const startInstance = providedConfiguration || {};

    return {
      businessKey: null,
      variables: null,
      ...startInstance
    };
  }

  async getSavedConfiguration(tab) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, START_DETAILS_CONFIG_KEY);
  }

  async getSavedProcessDefinition(tab) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, PROCESS_DEFINITION_CONFIG_KEY);
  }

  async saveProcessDefinition(tab, deployment) {
    if (!deployment || !deployment.deployedProcessDefinition) {
      return;
    }

    const {
      deployedProcessDefinition: processDefinition
    } = deployment;

    const {
      config
    } = this.props;

    return await config.setForFile(tab.file, PROCESS_DEFINITION_CONFIG_KEY, processDefinition);
  }

  async getConfigurationFromUserInput(tab, providedConfiguration, uiOptions) {
    const configuration = await this.getDefaultConfiguration(providedConfiguration);

    return new Promise(resolve => {
      const handleClose = (action, configuration) => {

        this.setState({
          overlayState: null,
          activeButton: false
        });

        // set businessKey to `null`
        if (configuration && !configuration.businessKey) {
          configuration.businessKey = null;
        }

        // contract: if configuration provided, user closed with O.K.
        // otherwise they canceled it
        return resolve({ action, configuration });
      };

      this.setState({
        overlayState: {
          tab,
          configuration,
          handleClose,
          isStart: true,
          ...uiOptions
        }
      });
    });
  }

  startWithConfiguration(configuration, processDefinition, endpoint) {

    const api = new CamundaAPI(endpoint);

    return api.startInstance(processDefinition, configuration);
  }

  async handleStartSuccess(processInstance, endpoint) {
    const {
      displayNotification
    } = this.props;

    const {
      url
    } = endpoint;

    const cockpitUrl = await this.getCockpitUrl(url);

    displayNotification({
      type: 'success',
      title: 'Process instance started',
      content: <CockpitProcessInstanceLink cockpitUrl={ cockpitUrl } processInstance={ processInstance } />,
      duration: 8000
    });
  }

  handleStartError(tab, error) {
    const {
      log,
      displayNotification,
      triggerAction
    } = this.props;

    const logMessage = {
      category: 'start-instance-error',
      message: error.problems || error.message,
      silent: true
    };

    log(logMessage);

    const content = <button
      onClick={ () => triggerAction('open-log') }>
      See the log for further details.
    </button>;

    displayNotification({
      type: 'error',
      title: START_INSTANCE_FAILED,
      content: content,
      duration: 4000
    });
  }

  handleDeploymentSuccess(tab, deployment, version) {

    const {
      triggerAction
    } = this.props;

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.done',
      payload: {
        deployment,
        context: 'startInstanceTool',
        deployedTo: {
          executionPlatformVersion: version,
          executionPlatform: ENGINES.PLATFORM
        }
      }
    });

    return this.saveProcessDefinition(tab, deployment);
  }

  handleDeploymentError(tab, error, version) {
    const {
      log,
      displayNotification,
      triggerAction
    } = this.props;

    const logMessage = {
      category: 'deploy-error',
      message: error.problems || error.details || error.message
    };

    const content = <button
      onClick={ ()=> log(logMessage) }>
      See the log for further details.
    </button>;

    displayNotification({
      type: 'error',
      title: START_INSTANCE_FAILED,
      content,
      duration: 4000
    });

    // If we retrieved the executionPlatformVersion, include it in event
    const deployedTo = (version &&
       { executionPlatformVersion: version, executionPlatform: ENGINES.PLATFORM }) || undefined;

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.error',
      payload: {
        error,
        context: 'startInstanceTool',
        ...(deployedTo && { deployedTo: deployedTo })
      }
    });
  }

  toggleOverlay() {
    const {
      activeButton,
      overlayState
    } = this.state;

    if (overlayState) {

      // (1.1) close start instance overlay
      overlayState.handleClose();

    } else if (!overlayState && activeButton) {

      // (1.2) close deploy overlay
      this.props.deployService.closeOverlay();
    }
  }

  async getCockpitUrl(engineUrl) {
    return await determineCockpitUrl(engineUrl);
  }

  render() {
    const {
      activeTab,
      overlayState
    } = this.state;

    return <React.Fragment>

      { isBpmnTab(activeTab) &&
      <Fill slot="status-bar__file" group="8_deploy">
        <OverlayDropdown
          title="Start current diagram"
          className={ classNames(css.StartInstanceTool, { 'btn--active': this.state.activeButton }) }
          items={ this.START_ACTIONS }
          buttonRef={ this.anchorRef }
          overlayState={ this.state.activeButton }
          onClose={ this.toggleOverlay.bind(this) }
        >
          <PlayIcon className="icon" />
        </OverlayDropdown>
      </Fill>
      }

      { overlayState && overlayState.isStart &&
      <StartInstanceConfigOverlay
        configuration={ overlayState.configuration }
        activeTab={ overlayState.tab }
        onSubmit={ overlayState.handleClose }
        onClose={ overlayState.handleClose }
        title={ overlayState.title }
        anchor={ this.anchorRef.current }
      />
      }
    </React.Fragment>;
  }

}

// helpers //////////

function isBpmnTab(tab) {
  return tab && tab.type === 'bpmn';
}
