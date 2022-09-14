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

import classNames from 'classnames';

import { default as CamundaAPI, ApiErrors, ConnectionError } from '../shared/CamundaAPI';
import AuthTypes from '../shared/AuthTypes';

import DeploymentConfigOverlay from './DeploymentConfigOverlay';
import DeploymentConfigValidator from './validation/DeploymentConfigValidator';
import { DeploymentError } from '../shared/CamundaAPI';

import css from './DeploymentTool.less';

import {
  generateId
} from '../../../util';

import { Fill } from '../../../app/slot-fill';

import DeployIcon from 'icons/Deploy.svg';

import { ENGINES } from '../../../util/Engines';

const DEPLOYMENT_DETAILS_CONFIG_KEY = 'deployment-tool';
const ENGINE_ENDPOINTS_CONFIG_KEY = 'camundaEngineEndpoints';
const PROCESS_DEFINITION_CONFIG_KEY = 'process-definition';

const SELF_HOSTED = 'selfHosted';

const DEFAULT_ENDPOINT = {
  url: 'http://localhost:8080/rest',
  authType: AuthTypes.basic,
  rememberCredentials: false
};

const TOMCAT_DEFAULT_URL = 'http://localhost:8080/engine-rest';

export default class DeploymentTool extends PureComponent {
  constructor() {
    super();

    this.state = {
      overlayState: null,
      activeTab: null,
      anchor: null
    };

    this.validator = new DeploymentConfigValidator();
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

    this.props.subscribe('app.focus-changed', () => {
      if (this.focusChangeCallback) {
        this.focusChangeCallback();
      }
    });
  }

  subscribeToFocusChange = (callback) => {
    this.focusChangeCallback = callback;
  };

  unsubscribeFromFocusChange = () => {
    delete this.focusChangeCallback;
  };

  saveTab = (tab) => {
    const {
      triggerAction
    } = this.props;

    return triggerAction('save-tab', { tab });
  };

  deploy = (options = {}) => {
    const {
      activeTab
    } = this.state;

    return this.deployTab(activeTab, options, this._anchorRef);
  };

  async deployTab(tab, options = {}, anchor) {

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
      } = await this.getConfigurationFromUserInput(tab, configuration, { anchor });

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
    let version;

    try {

      // (3.1) Retrieve version we deploy to via API
      try {
        version = (await this.getVersion(configuration)).version;
      } catch (error) {
        if (!(error instanceof ConnectionError)) {
          throw error;
        }
        version = null;
      }

      // (3.2) Deploy via API
      const deployment = await this.deployWithConfiguration(tab, configuration);

      // (3.3) save deployed process definition
      await this.saveProcessDefinition(tab, deployment);

      // (3.4) Handle deployment success or error
      await this.handleDeploymentSuccess(tab, deployment, version, configuration);
    } catch (error) {

      if (!(error instanceof DeploymentError)) {
        throw error;
      }

      await this.handleDeploymentError(tab, error, version);
    }
  }

  handleDeploymentSuccess(tab, deployment, version, configuration) {
    const {
      displayNotification,
      triggerAction
    } = this.props;

    const {
      endpoint
    } = configuration;

    const {
      url
    } = endpoint;

    displayNotification({
      type: 'success',
      title: `${getDeploymentType(tab)} deployed`,
      content: <CockpitLink endpointUrl={ url } deployment={ deployment } />,
      duration: 8000
    });

    // notify interested parties
    triggerAction('emit-event', {
      type: 'deployment.done',
      payload: {
        deployment,
        targetType: SELF_HOSTED,
        deployedTo: {
          executionPlatformVersion: version,
          executionPlatform: ENGINES.PLATFORM
        },
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

  handleDeploymentError(tab, error, version) {
    const {
      log,
      displayNotification,
      triggerAction
    } = this.props;

    const logMessage = {
      category: 'deploy-error',
      message: error.problems || error.details || error.message,
      silent: true
    };

    log(logMessage);

    const content = <button
      onClick={ () => triggerAction('open-log') }>
      See the log for further details.
    </button>;

    displayNotification({
      type: 'error',
      title: 'Deployment failed',
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
        targetType: SELF_HOSTED,
        context: 'deploymentTool',
        ...(deployedTo && { deployedTo: deployedTo })
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
      deployment: withSerializedAttachments(deployment),
      endpointId: endpoint.id
    };

    await this.setTabConfiguration(tab, tabConfiguration);

    return configuration;
  }

  removeCredentials = async () => {
    const savedConfiguration = await this.getSavedConfiguration(this.state.activeTab);

    // do not remove credentials from a non existing endpoint configuration
    if (!savedConfiguration || !savedConfiguration.endpoint) {
      return;
    }

    this.saveEndpoint({
      ...savedConfiguration.endpoint,
      rememberCredentials: false
    });
  };

  saveCredentials = async (credentials) => {
    const savedConfiguration = await this.getSavedConfiguration(this.state.activeTab);

    // do not save credentials on a non existing endpoint configuration
    if (!savedConfiguration || !savedConfiguration.endpoint) {
      return;
    }

    this.saveEndpoint({
      ...savedConfiguration.endpoint,
      rememberCredentials: true,
      ...credentials
    });
  };

  async saveEndpoint(endpoint) {

    const {
      rememberCredentials
    } = endpoint;

    const endpointToSave = rememberCredentials ? endpoint : withoutCredentials(endpoint);

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

    const deploymentWithAttachments = await this.withAttachments(deployment);

    const endpoints = await this.getEndpoints();

    return {
      deployment: deploymentWithAttachments,
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

  getVersion(configuration) {

    const { endpoint } = configuration;

    const api = new CamundaAPI(endpoint);

    return api.getVersion();
  }

  canDeployWithConfiguration(configuration) {
    return this.validator.isConfigurationValid(configuration);
  }

  async getConfigurationFromUserInput(tab, providedConfiguration, uiOptions) {
    const configuration = await this.getDefaultConfiguration(tab, providedConfiguration);

    return new Promise(resolve => {
      const handleClose = (action, configuration) => {

        this.setState({
          overlayState: null,
          activeButton: false
        });

        // inform validator to cancel ongoing requests
        this.validator.cancel();

        // contract: if configuration provided, user closed with O.K.
        // otherwise they canceled it
        return resolve({ action, configuration });
      };

      this.setState({
        overlayState: {
          tab,
          configuration,
          handleClose,
          ...uiOptions
        }
      });
    });
  }

  async withAttachments(deployment) {
    const fileSystem = this.props._getGlobal('fileSystem');
    const { attachments = [] } = deployment;

    async function readFile(path) {
      try {

        // (1) try to read file from file system
        const file = await fileSystem.readFile(path, { encoding: false });

        // (2a) store contents as a File object
        // @barmac: This is required for the performance reasons. The contents retrieved from FS
        // is a Uint8Array. During the form submission, Formik builds a map of touched fields
        // and it traverses all nested objects for that. The outcome was that the form would freeze
        // for a couple of seconds when one tried to re-deploy a file of size >1MB, because Formik
        // tried to build a map with bits' indexes as keys with all values as `true`. Wrapping the
        // contents in a File object prevents such behavior.
        return {
          ...file,
          contents: new File([ file.contents ], file.name)
        };
      } catch {

        // (2b) if read fails, return an empty file descriptor
        return {
          contents: null,
          path,
          name: basename(path)
        };
      }
    }

    const files = await Promise.all(attachments.map(({ path }) => readFile(path)));

    return {
      ...deployment,
      attachments: files
    };
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
        attachments: [],
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

  closeOverlay(overlayState) {
    const currentModalState = overlayState || this.state.overlayState;
    currentModalState.handleClose('cancel', null);
  }

  render() {
    const {
      activeTab,
      overlayState
    } = this.state;

    // TODO(nikku): we'll remove the flag once we make re-deploy
    // the primary button action: https://github.com/camunda/camunda-modeler/issues/1440

    const isDeployOpen = () => {
      return overlayState ? overlayState.anchor === this._anchorRef : false;
    };

    const onClick = () => {
      if (overlayState)
        this.closeOverlay(overlayState);

      else this.deploy({ configure: true });
    };

    return <React.Fragment>
      { isCamundaTab(activeTab) && <Fill slot="status-bar__file" group="8_deploy">
        <button
          onClick={ onClick }
          title="Deploy current diagram"
          className={ classNames('btn', css.DeploymentTool, { 'btn--active': isDeployOpen() }) }
          ref={ this._anchorRef }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill> }

      { overlayState &&
      <DeploymentConfigOverlay
        configuration={ overlayState.configuration }
        activeTab={ overlayState.tab }
        title={ overlayState.title }
        intro={ overlayState.intro }
        primaryAction={ overlayState.primaryAction }
        onClose={ overlayState.handleClose }
        validator={ this.validator }
        saveCredentials={ this.saveCredentials }
        removeCredentials={ this.removeCredentials }
        subscribeToFocusChange={ this.subscribeToFocusChange }
        unsubscribeFromFocusChange={ this.unsubscribeFromFocusChange }
        anchor={ overlayState ? overlayState.anchor.current : null }
      />
      }
    </React.Fragment>;
  }

}

function CockpitLink(props) {
  const {
    endpointUrl,
    deployment
  } = props;

  const {
    id,
    deployedProcessDefinition
  } = deployment;

  const baseUrl = getWebAppsBaseUrl(endpointUrl);

  const query = `deploymentsQuery=%5B%7B%22type%22:%22id%22,%22operator%22:%22eq%22,%22value%22:%22${id}%22%7D%5D`;
  const cockpitUrl = `${baseUrl}/cockpit/default/#/repository/?${query}`;

  return (
    <div className={ css.CockpitLink }>
      {deployedProcessDefinition ?
        (
          <div>
            Process definition ID:
            <code>{deployedProcessDefinition.id} </code>
          </div>
        )
        : null}
      <a href={ cockpitUrl }>
        Open in Camunda Cockpit
      </a>
    </div>
  );
}

// helpers //////////

function withoutExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}

function withoutCredentials(endpoint) {
  return omit(endpoint, [ 'username', 'password', 'token' ]);
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

function isCamundaTab(tab) {
  return tab && [
    'bpmn',
    'cmmn',
    'dmn',
    'form'
  ].includes(tab.type);
}

function getDeploymentType(tab) {
  const { type } = tab;

  if (type === 'bpmn') {
    return 'Process definition';
  }

  else if (type === 'dmn') {
    return 'Decision definition';
  }

  else if (type === 'cmmn') {
    return 'Case definition';
  }

  else if (type === 'form') {
    return 'Form';
  }
}

function withSerializedAttachments(deployment) {
  const { attachments: fileList = [] } = deployment;
  const attachments = fileList.map(file => ({ path: file.path }));

  return { ...deployment, attachments };
}

function basename(filePath) {
  return filePath.split('\\').pop().split('/').pop();
}

function getWebAppsBaseUrl(url) {
  const [ protocol,, host, restRoot ] = url.split('/');

  return isTomcat(restRoot) ? `${protocol}//${host}/camunda/app` : `${protocol}//${host}/app`;
}

function isTomcat(restRoot) {
  return restRoot === 'engine-rest';
}