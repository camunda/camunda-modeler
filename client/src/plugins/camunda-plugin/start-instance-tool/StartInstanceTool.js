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

import CamundaAPI from '../shared/CamundaAPI';

import StartInstanceConfigModal from './StartInstanceConfigModal';

import css from './StartInstanceTool.less';

import { Fill } from '../../../app/slot-fill';

import {
  DropdownButton,
  Icon
} from '../../../app/primitives';

import isExecutable from './util/isExecutable';

const START_DETAILS_CONFIG_KEY = 'start-instance-tool';

const START_INSTANCE_FAILED = 'Starting process instance failed';

const PROCESS_DEFINITION_CONFIG_KEY = 'process-definition';

export default class StartInstanceTool extends PureComponent {

  state = {
    modalState: null,
    activeTab: null
  }

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

  componentDidMount() {

    const {
      subscribe
    } = this.props;

    subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({ activeTab });
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
      intro: 'Specify deployment details to deploy this diagram to Camunda.',
      primaryAction: 'Next'
    });

    if (action === 'cancel') {
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

  async startInstance(options={}) {

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
        duration: 10000
      });

      return;
    }

    // (3) Ensure deployment config is available
    let deploymentConfig = await deployService.getSavedDeployConfiguration(tab);

    // (3.1) Check connection to engine
    const showDeployConfig = configure || !deploymentConfig ||
      await this.checkConnection(deploymentConfig.endpoint);

    if (showDeployConfig) {

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

      const uiOptions = {
        title: configure ? 'Start Process Instance - Step 2 of 2' : null
      };

      // (4.3) Open Modal to enter start configuration
      const {
        action,
        configuration: userConfiguration
      }= await this.getConfigurationFromUserInput(
        tab,
        startConfiguration,
        uiOptions
      );

      // (4.3.1) Handle user cancelation
      if (action === 'cancel') {
        return;
      }

      startConfiguration = await this.saveConfiguration(tab, userConfiguration);
    }

    // (5) Trigger deployment
    try {
      const deployment = await this.deploy(tab, deploymentConfig);

      await this.handleDeploymentSuccess(tab, deployment);
    } catch (error) {
      return await this.handleDeploymentError(tab, error);
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
        await this.startWithConfiguration(startConfiguration, processDefinition, endpoint);

      await this.handleStartSuccess(processInstance, endpoint);
    } catch (error) {
      await this.handleStartError(tab, error);
    }
  }

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
      businessKey: 'default',
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
          modalState: null
        });

        // contract: if configuration provided, user closed with O.K.
        // otherwise they canceled it
        return resolve({ action, configuration });
      };

      this.setState({
        modalState: {
          tab,
          configuration,
          handleClose,
          ...uiOptions
        }
      });
    });
  }

  startWithConfiguration(configuration, processDefinition, endpoint) {

    const api = new CamundaAPI(endpoint);

    return api.startInstance(processDefinition, configuration);
  }

  handleStartSuccess(processInstance, endpoint) {
    const {
      displayNotification
    } = this.props;

    const {
      url
    } = endpoint;

    displayNotification({
      type: 'success',
      title: 'Process instance started successfully',
      content: <CockpitLink endpointUrl={ url } processInstance={ processInstance } />,
      duration: 10000
    });
  }

  handleStartError(tab, error) {
    const {
      log,
      displayNotification
    } = this.props;

    displayNotification({
      type: 'error',
      title: START_INSTANCE_FAILED,
      content: 'See the log for further details.',
      duration: 10000
    });

    log({
      category: 'start-instance-error',
      message: error.problems || error.message
    });
  }

  handleDeploymentSuccess(tab, deployment) {

    const {
      triggerAction
    } = this.props;

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.done',
      payload: {
        deployment,
        context: 'startInstanceTool'
      }
    });

    return this.saveProcessDefinition(tab, deployment);
  }

  handleDeploymentError(tab, error) {
    const {
      log,
      displayNotification,
      triggerAction
    } = this.props;

    displayNotification({
      type: 'error',
      title: START_INSTANCE_FAILED,
      content: 'Deployment was not successful. See the log for further details.',
      duration: 10000
    });

    log({
      category: 'deploy-error',
      message: error.problems || error.details || error.message
    });

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.error',
      payload: {
        error,
        context: 'startInstanceTool'
      }
    });
  }

  render() {
    const {
      activeTab,
      modalState
    } = this.state;

    return <React.Fragment>

      { isBpmnTab(activeTab) &&
      <Fill slot="toolbar" group="8_deploy">
        <DropdownButton
          onClick={ this.startInstance.bind(this) }
          title="Start Current Diagram"
          className={ css.StartInstanceTool }
          multiButton
          items={ this.START_ACTIONS }
        >
          <PlayIcon className="icon" />
        </DropdownButton>
      </Fill>
      }

      { modalState &&
        <StartInstanceConfigModal
          configuration={ modalState.configuration }
          activeTab={ modalState.tab }
          onClose={ modalState.handleClose }
          title={ modalState.title }
        />
      }
    </React.Fragment>;
  }

}


function CockpitLink(props) {
  const {
    endpointUrl,
    processInstance
  } = props;

  const {
    id
  } = processInstance;

  const baseUrl = getWebAppsBaseUrl(endpointUrl);

  const cockpitUrl = `${baseUrl}/cockpit/default/#/process-instance/${id}`;

  return (
    <div className={ css.CockpitLink }>
      <a href={ cockpitUrl }>
        Open in Camunda Cockpit
        <Icon name="open" />
      </a>
    </div>
  );
}


// helpers //////////

function isBpmnTab(tab) {
  return tab && tab.type === 'bpmn';
}

function getWebAppsBaseUrl(url) {
  const [ protocol,, host, restRoot ] = url.split('/');

  return isTomcat(restRoot) ? `${protocol}//${host}/camunda/app` : `${protocol}//${host}/app`;
}

function isTomcat(restRoot) {
  return restRoot === 'engine-rest';
}
