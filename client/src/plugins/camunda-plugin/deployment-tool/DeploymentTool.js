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

import CamundaAPI from '../shared/CamundaAPI';
import AuthTypes from '../shared/AuthTypes';
import KeyboardInteractionTrap from '../shared/KeyboardInteractionTrap';

import DeploymentConfigModal from './DeploymentConfigModal';
import DeploymentConfigValidator from './DeploymentConfigValidator';

import {
  generateId
} from '../../../util';

import { Fill } from '../../../app/slot-fill';

import {
  Button,
  Icon
} from '../../../app/primitives';

const DEPLOYMENT_DETAILS_CONFIG_KEY = 'deployment-tool';
const ENGINE_ENDPOINTS_CONFIG_KEY = 'camundaEngineEndpoints';

const DEFAULT_ENDPOINT = {
  url: 'http://localhost:8080/engine-rest',
  authType: AuthTypes.none,
  rememberCredentials: false
};

export default class DeploymentTool extends PureComponent {

  state = {
    modalState: null,
    activeTab: null
  }

  validator = new DeploymentConfigValidator();

  componentDidMount() {
    this.props.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({ activeTab });
    });
  }

  saveTab = (tab) => {
    const {
      triggerAction
    } = this.props;

    return triggerAction('save-tab', { tab });
  }

  deploy = (options = {}) => {
    const {
      activeTab
    } = this.state;

    return this.deployTab(activeTab, options);
  }

  async deployTab(tab, options={}) {

    const {
      configure
    } = options;

    // (1) Open save file dialog if dirty
    tab = await this.saveTab(tab);

    // (1.1) Cancel deploy if file save cancelled
    if (!tab) {
      return;
    }

    // (2) Get deployment configuration
    // (2.1) Try to get existing deployment configuration
    let configuration = await this.getSavedConfiguration(tab);

    // (2.2) Check if configuration are complete
    const showConfiguration = configure || !this.canDeployWithConfiguration(configuration);

    if (showConfiguration) {

      // (2.3) Open modal to enter deployment configuration
      const {
        action,
        configuration: userConfiguration
      } = await this.getConfigurationFromUserInput(tab, configuration);

      // (2.3.1) Handle user cancelation
      if (action === 'cancel') {
        return;
      }

      configuration = await this.saveConfiguration(tab, userConfiguration);

      if (action === 'save') {
        return;
      }
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)

    try {
      const deployment = await this.deployWithConfiguration(tab, configuration);

      await this.handleDeploymentSuccess(tab, deployment);
    } catch (error) {
      await this.handleDeploymentError(tab, error);
    }
  }

  handleDeploymentSuccess(tab, deployment) {
    const {
      displayNotification
    } = this.props;

    displayNotification({
      type: 'success',
      title: 'Deployment succeeded',
      duration: 4000
    });
  }

  handleDeploymentError(tab, error) {
    const {
      log,
      displayNotification
    } = this.props;

    displayNotification({
      type: 'error',
      title: 'Deployment failed',
      content: 'See the log for further details.',
      duration: 10000
    });

    log({
      category: 'deploy-error',
      message: error.problems || error.details || error.message
    });
  }

  async saveConfiguration(tab, configuration) {

    const {
      endpoint,
      deployment
    } = configuration;

    await this.saveEndpoint(endpoint);

    const tabConfiguration = {
      deployment,
      endpointId: endpoint.id
    };

    await this.setTabConfiguration(tab, tabConfiguration);

    return configuration;
  }

  async saveEndpoint(endpoint) {

    const {
      id,
      url,
      authType,
      rememberCredentials,
      username,
      password,
      token
    } = endpoint;

    const authConfiguration =
      authType === AuthTypes.none
        ? {}
        : authType === AuthTypes.basic
          ? {
            username,
            password: rememberCredentials ? password : ''
          }
          : {
            token: rememberCredentials ? token : ''
          };

    const endpointConfiguration = {
      id,
      url,
      authType,
      rememberCredentials,
      ...authConfiguration
    };

    const existingEndpoints = await this.getEndpoints();

    const updatedEndpoints = addOrUpdateById(existingEndpoints, endpointConfiguration);

    await this.setEndpoints(updatedEndpoints);

    return endpointConfiguration;
  }

  async getSavedConfiguration(tab) {

    const tabConfig = await this.getTabConfiguration(tab);

    if (!tabConfig) {
      return undefined;
    }

    const {
      deployment,
      endpointId
    } = tabConfig;

    const endpoints = await this.getEndpoints();

    return {
      deployment,
      endpoint: endpoints.find(endpoint => endpoint.id === endpointId)
    };
  }

  deployWithConfiguration(tab, configuration) {

    const {
      endpoint,
      deployment
    } = configuration;

    const api = new CamundaAPI(endpoint);

    return api.deployDiagram(tab.file, deployment);
  }

  canDeployWithConfiguration(configuration) {

    // TODO(nikku): we'll re-enable this, once we make re-deploy
    // the primary button action: https://github.com/camunda/camunda-modeler/issues/1440
    return false;

    // return this.validator.isConfigurationValid(configuration);
  }

  async getConfigurationFromUserInput(tab, providedConfiguration, uiOptions) {
    const configuration = await this.getDefaultConfiguration(tab, providedConfiguration);

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

  getEndpoints() {
    return this.props.config.get(ENGINE_ENDPOINTS_CONFIG_KEY, []);
  }

  setEndpoints(endpoints) {
    return this.props.config.set(ENGINE_ENDPOINTS_CONFIG_KEY, endpoints);
  }

  getTabConfiguration(tab) {
    return this.props.config.getForFile(tab.file, DEPLOYMENT_DETAILS_CONFIG_KEY);
  }

  setTabConfiguration(tab, configuration) {
    return this.props.config.setForFile(tab.file, DEPLOYMENT_DETAILS_CONFIG_KEY, configuration);
  }

  /**
   * Get endpoint to be used by the current tab.
   *
   * @return {EndpointConfig}
   */
  async getDefaultEndpoint(tab, providedEndpoint) {

    let endpoint = {};

    if (providedEndpoint) {
      endpoint = providedEndpoint;
    } else {

      const existingEndpoints = await this.getEndpoints();

      if (existingEndpoints.length) {
        endpoint = existingEndpoints[0];
      }
    }

    return {
      ...DEFAULT_ENDPOINT,
      ...endpoint,
      id: endpoint.id || generateId()
    };
  }

  async getDefaultConfiguration(tab, providedConfiguration = {}) {
    const endpoint = await this.getDefaultEndpoint(tab, providedConfiguration.endpoint);

    const deployment = providedConfiguration.deployment || {};

    return {
      endpoint,
      deployment: {
        name: withoutExtension(tab.name),
        ...deployment
      }
    };
  }

  render() {
    const {
      activeTab,
      modalState
    } = this.state;

    return <React.Fragment>
      { activeTab && activeTab.type !== 'empty' && <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy }
          title="Deploy current diagram"
        >
          <Icon name="deploy" />
        </Button>
      </Fill> }

      { modalState &&
        <KeyboardInteractionTrap triggerAction={ this.props.triggerAction }>
          <DeploymentConfigModal
            configuration={ modalState.configuration }
            activeTab={ modalState.tab }
            title={ modalState.title }
            intro={ modalState.intro }
            primaryAction={ modalState.primaryAction }
            onClose={ modalState.handleClose }
            validator={ this.validator }
          />
        </KeyboardInteractionTrap>
      }
    </React.Fragment>;
  }

}



// helpers //////////

function withoutExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}

function addOrUpdateById(collection, element) {

  const index = collection.findIndex(el => el.id === element.id);

  if (index !== -1) {
    return [
      ...collection.slice(0, index),
      element,
      ...collection.slice(index + 1)
    ];
  }

  return [
    ...collection,
    element
  ];
}
