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

import { omit } from 'min-dash';

import { default as CamundaAPI, ApiErrors } from '../shared/CamundaAPI';
import AuthTypes from '../shared/AuthTypes';

import DeploymentConfigModal from './DeploymentConfigModal';
import DeploymentConfigValidator from './validation/DeploymentConfigValidator';

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
const PROCESS_DEFINITION_CONFIG_KEY = 'process-definition';

const DEFAULT_ENDPOINT = {
  url: 'http://localhost:8080/rest',
  authType: AuthTypes.basic,
  rememberCredentials: false
};

const TOMCAT_DEFAULT_URL = 'http://localhost:8080/engine-rest';

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

    this.props.subscribe('app.focus-changed', () => {
      if (this.focusChangeCallback) {
        this.focusChangeCallback();
      }
    });
  }

  subscribeToFocusChange = (callback) => {
    this.focusChangeCallback = callback;
  }

  unsubscribeFromFocusChange = () => {
    delete this.focusChangeCallback;
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

      // (3.2) save deployed process definition
      await this.saveProcessDefinition(tab, deployment);

      await this.handleDeploymentSuccess(tab, deployment);
    } catch (error) {
      await this.handleDeploymentError(tab, error);
    }
  }

  handleDeploymentSuccess(tab, deployment) {
    const {
      displayNotification,
      triggerAction
    } = this.props;

    displayNotification({
      type: 'success',
      title: 'Deployment succeeded',
      duration: 4000
    });

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.done',
      payload: {
        deployment,
        context: 'deploymentTool'
      }
    });
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

  handleDeploymentError(tab, error) {
    const {
      log,
      displayNotification,
      triggerAction
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

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.error',
      payload: {
        error,
        context: 'deploymentTool'
      }
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

  removeCredentials = async () => {
    const savedConfiguration = await this.getSavedConfiguration(this.state.activeTab);
    const omited = omit(savedConfiguration.endpoint, ['username', 'password', 'token']);
    this.saveEndpoint({
      ...omited,
      rememberCredentials: false
    });
  }

  saveCredential = async (credential) => {
    const savedConfiguration = await this.getSavedConfiguration(this.state.activeTab);
    this.saveEndpoint({
      ...savedConfiguration.endpoint,
      rememberCredentials: true,
      ...credential
    });
  }

  async saveEndpoint(endpoint) {

    const {
      rememberCredentials
    } = endpoint;

    const endpointToSave = rememberCredentials ? endpoint : omit(endpoint, ['username', 'password', 'token']);

    const existingEndpoints = await this.getEndpoints();

    const updatedEndpoints = addOrUpdateById(existingEndpoints, endpointToSave);

    await this.setEndpoints(updatedEndpoints);

    return endpointToSave;
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

        // inform validator to cancel ongoing requests
        this.validator.cancel();

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

    let endpoint = {},
        defaultUrl = DEFAULT_ENDPOINT.url;

    if (providedEndpoint) {
      endpoint = providedEndpoint;
    } else {

      const existingEndpoints = await this.getEndpoints();

      if (existingEndpoints.length) {
        endpoint = existingEndpoints[0];
      }
    }

    if (!endpoint.url && (await this.isTomcatRunning())) {
      defaultUrl = TOMCAT_DEFAULT_URL;
    }

    // since we have deprecated AuthTypes.none, we should correct existing
    // configurations
    if (endpoint.authType !== AuthTypes.basic && endpoint.authType !== AuthTypes.bearer) {
      endpoint.authType = DEFAULT_ENDPOINT.authType;
    }

    return {
      ...DEFAULT_ENDPOINT,
      url: defaultUrl,
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

  async isTomcatRunning() {
    const result = await this.validator.validateConnectionWithoutCredentials(TOMCAT_DEFAULT_URL);

    if (!result) {
      return true;
    }

    const { code } = result;

    return (code !== ApiErrors.NO_INTERNET_CONNECTION &&
            code !== ApiErrors.CONNECTION_FAILED &&
              code !== ApiErrors.NOT_FOUND);
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
      <DeploymentConfigModal
        configuration={ modalState.configuration }
        activeTab={ modalState.tab }
        title={ modalState.title }
        intro={ modalState.intro }
        primaryAction={ modalState.primaryAction }
        onClose={ modalState.handleClose }
        validator={ this.validator }
        saveCredential={ this.saveCredential }
        removeCredentials={ this.removeCredentials }
        subscribeToFocusChange={ this.subscribeToFocusChange }
        unsubscribeFromFocusChange={ this.unsubscribeFromFocusChange }
      />
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
