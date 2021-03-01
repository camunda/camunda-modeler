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

import {
  omit
} from 'min-dash';

import pDefer from 'p-defer';

import { Fill } from '../../../app/slot-fill';

import {
  Button,
  Icon
} from '../../../shared/ui';

import {
  generateId
} from '../../../util';

import { AUTH_TYPES } from './../shared/ZeebeAuthTypes';

import { SELF_HOSTED } from '../shared/ZeebeTargetTypes';

import DeploymentPluginModal from './DeploymentPluginModal';

import DeploymentPluginValidator from './DeploymentPluginValidator';

const DEPLOYMENT_CONFIG_KEY = 'zeebe-deployment-tool';

const ZEEBE_ENDPOINTS_CONFIG_KEY = 'zeebeEndpoints';

const GRPC_ERROR_CODES = {
  0: 'OK',
  1: 'CANCELLED',
  2: 'UNKNOWN',
  3: 'INVALID_ARGUMENT',
  4: 'DEADLINE_EXCEEDED',
  5: 'NOT_FOUND',
  6: 'ALREADY_EXISTS',
  7: 'PERMISSION_DENIED',
  8: 'RESOURCE_EXHAUSTED',
  9: 'FAILED_PRECONDITION',
  10: 'ABORTED',
  11: 'OUT_OF_RANGE',
  12: 'UNIMPLEMENTED',
  13: 'INTERNAL',
  14: 'UNAVAILABLE',
  15: 'DATA_LOSS',
  16: 'UNAUTHENTICATED'
};

export default class DeploymentPlugin extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      activeTab: null,
      modalState: null
    };
    this.validator = new DeploymentPluginValidator(props._getGlobal('zeebeAPI'));
    this.connectionChecker = this.validator.createConnectionChecker();
  }

  componentDidMount() {
    this.props.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({
        activeTab
      });
    });

    this.props.subscribeToMessaging('deploymentPlugin', this.onMessageReceived);
  }

  componentWillUnmount() {
    this.props.unsubscribeFromMessaging('deploymentPlugin');
  }

  async deploy(options = {}) {
    return this.deployTab(this.state.activeTab, options);
  }

  async deployTab(tab, options) {

    /**
     * Notify interested parties via optional callback.
     *
     * @param {object} result
     * @param {object|null} result.deploymentResult - null for cancellation
     * @param {object} [result.endpoint]
     */
    function notifyResult(result) {
      const { done } = options;

      return done && done(result);
    }

    // (1) save tab
    const savedTab = await this.saveTab(tab);

    // cancel action if save was cancelled
    if (!savedTab) {
      notifyResult({ deploymentResult: null });

      return;
    }

    // (2) retrieve saved config
    let config = await this.getSavedConfig(tab);

    const endpoint = await this.getDefaultEndpoint(tab);

    config = {
      ...config,
      endpoint
    };

    // (2.1) open modal if config is incomplete
    const canDeploy = await this.canDeployWithConfig(config, options);

    if (!canDeploy) {
      config = await this.getConfigFromUser(config, savedTab, options);

      // user canceled
      if (!config) {
        notifyResult({ deploymentResult: null });

        return;
      }
    }

    // (3) save config
    await this.saveConfig(savedTab, config);

    // (4) deploy
    const deploymentResult = await this.deployWithConfig(savedTab, config);

    // (5) notify interested parties
    notifyResult({ deploymentResult, endpoint: config.endpoint });

    const { response, success } = deploymentResult;

    if (!success) {
      this.onDeploymentError(response, config, options);
    } else {
      this.onDeploymentSuccess(response, config, options);
    }
  }

  deployWithConfig(tab, config) {
    const { file: { path } } = tab;
    const {
      deployment: { name },
      endpoint
    } = config;

    const zeebeAPI = this.props._getGlobal('zeebeAPI');

    return zeebeAPI.deploy({
      filePath: path,
      name,
      endpoint
    });
  }

  saveTab(tab) {
    return this.props.triggerAction('save', { tab });
  }

  async canDeployWithConfig(config, options) {

    // always open modal for deployment tool
    if (!options.isStart) {
      return false;
    }

    // return early for missing essential parts
    if (!config.deployment || !config.endpoint) {
      return false;
    }

    const validationResult = this.validator.validateConfig(config);
    const isConfigValid = Object.keys(validationResult).length === 0;

    if (!isConfigValid) {
      return false;
    }

    const { connectionResult } = await this.connectionChecker.check(config.endpoint);

    return connectionResult && connectionResult.success;
  }

  async getConfigFromUser(savedConfig, tab, options = {}) {

    const p = pDefer();

    const onClose = config => {
      this.closeModal();

      return p.resolve(config);
    };

    const defaultConfiguration = await this.getDefaultConfig(savedConfig, tab);

    const modalState = {
      config: defaultConfiguration,
      isStart: !!options.isStart,
      onClose
    };

    // open modal
    this.setState({
      modalState
    });

    return p.promise;
  }

  onMessageReceived = (msg, body) => {
    if (msg === 'deploy') {
      this.deploy(body);
    }
  }

  async saveConfig(tab, config) {
    const {
      endpoint,
      deployment
    } = config;

    const endpointToSave = endpoint.rememberCredentials ? endpoint : withoutCredentials(endpoint);

    await this.saveEndpoint(endpointToSave);

    const tabConfiguration = {
      deployment,
      endpointId: endpointToSave.id
    };

    await this.setTabConfiguration(tab, tabConfiguration);

    return config;
  }

  async getSavedConfig(tab) {

    const tabConfig = await this.getTabConfiguration(tab);

    if (!tabConfig) {
      return {};
    }

    const {
      deployment
    } = tabConfig;

    return {
      deployment,
    };
  }

  async getDefaultEndpoint(tab) {
    let endpoint = {
      id: generateId(),
      targetType: SELF_HOSTED,
      authType: AUTH_TYPES.NONE,
      contactPoint: '0.0.0.0:26500',
      oauthURL: '',
      audience: '',
      clientId: '',
      clientSecret: '',
      camundaCloudClientId: '',
      camundaCloudClientSecret: '',
      camundaCloudClusterId: '',
      rememberCredentials: false
    };

    const previousEndpoints = await this.getEndpoints();
    if (previousEndpoints.length) {
      endpoint = previousEndpoints[0];
    }

    return endpoint;
  }

  async getDefaultConfig(savedConfig, tab) {
    const deployment = {
      name: withoutExtension(tab.name)
    };

    const endpoint = await this.getDefaultEndpoint(tab);

    return {
      deployment: {
        ...deployment,
        ...savedConfig.deployment
      },
      endpoint
    };
  }

  async saveEndpoint(endpoint) {
    const existingEndpoints = await this.getEndpoints();

    const updatedEndpoints = addOrUpdateById(existingEndpoints, endpoint);

    await this.setEndpoints(updatedEndpoints);

    return endpoint;
  }

  getEndpoints() {
    return this.props.config.get(ZEEBE_ENDPOINTS_CONFIG_KEY, []);
  }

  setEndpoints(endpoints) {
    return this.props.config.set(ZEEBE_ENDPOINTS_CONFIG_KEY, endpoints);
  }

  getTabConfiguration(tab) {
    return this.props.config.getForFile(tab.file, DEPLOYMENT_CONFIG_KEY);
  }

  setTabConfiguration(tab, configuration) {
    return this.props.config.setForFile(tab.file, DEPLOYMENT_CONFIG_KEY, configuration);
  }

  onDeploymentSuccess(response, configuration, options = {}) {
    const {
      displayNotification,
      triggerAction
    } = this.props;

    const {
      endpoint
    } = configuration;

    const {
      isStart
    } = options;

    if (!options.skipNotificationOnSuccess) {
      displayNotification({
        type: 'success',
        title: 'Deployment succeeded',
        duration: 4000
      });
    }

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.done',
      payload: {
        deployment: response,
        context: isStart ? 'startInstanceTool' : 'deploymentTool',
        targetType: endpoint && endpoint.targetType
      }
    });
  }

  onDeploymentError(response, configuration, options = {}) {
    const {
      log,
      displayNotification,
      triggerAction
    } = this.props;

    const {
      endpoint
    } = configuration;

    const {
      isStart
    } = options;

    displayNotification({
      type: 'error',
      title: 'Deployment failed',
      content: 'See the log for further details.',
      duration: 10000
    });

    log({
      category: 'deploy-error',
      message: response.details
    });

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.error',
      payload: {
        error: {
          ...response,
          code: getGRPCErrorCode(response)
        },
        context: isStart ? 'startInstanceTool' : 'deploymentTool',
        targetType: endpoint && endpoint.targetType
      }
    });
  }

  closeModal() {
    this.setState({ modalState: null });
  }

  onIconClicked = async () => {
    this.deploy();
  }

  render() {
    const {
      modalState,
      activeTab
    } = this.state;

    return <React.Fragment>
      { isZeebeTab(activeTab) &&
        <Fill slot="toolbar" group="8_deploy" priority={ 1 }>
          <Button
            onClick={ this.onIconClicked }
            title="Deploy current diagram"
          >
            <Icon name="deploy" />
          </Button>
        </Fill>
      }
      { modalState &&
        <DeploymentPluginModal
          onClose={ modalState.onClose }
          validator={ this.validator }
          onDeploy={ modalState.onClose }
          isStart={ modalState.isStart }
          config={ modalState.config }
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


// helper ////////////////

function withoutCredentials(endpointConfiguration) {
  return omit(endpointConfiguration, [
    'clientId',
    'clientSecret',
    'camundaCloudClientId',
    'camundaCloudClientSecret'
  ]);
}

function isZeebeTab(tab) {
  return tab && tab.type === 'cloud-bpmn';
}

function getGRPCErrorCode(error) {
  const {
    code
  } = error;

  return code ? GRPC_ERROR_CODES[code] : 'UNKNOWN';
}