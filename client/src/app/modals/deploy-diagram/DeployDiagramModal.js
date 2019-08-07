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

import View from './View';
import AuthTypes from './AuthTypes';

import errorMessageFunctions from './error-messages';
import getEditMenu from './getEditMenu';
import { debounce } from '../../../util';


const ENDPOINT_URL_PATTERN = /^https?:\/\/.+/;

const ENDPOINT_URL_SUFFIX = '/deployment/create';
const DEPLOY_CHECK_SUFFIX = '/deployment?maxResults=0';


const defaultState = {
  success: '',
  error: '',
  connectionError: null
};

const initialFormValues = {
  endpointUrl: 'http://localhost:8080/engine-rest',
  tenantId: '',
  deploymentName: 'diagram',
  authType: AuthTypes.none,
  username: '',
  password: '',
  bearer: ''
};


class DeployDiagramModal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = defaultState;
  }

  componentDidMount() {
    this.updateMenu();
  }

  handleDeploy = async (values, { setSubmitting }) => {
    if (this.state.connectionError) {
      setSubmitting(false);

      return;
    }

    const payload = this.getDeploymentPayload(values);

    this.saveEndpoint(values.endpointUrl);

    const { error, result } = await this.props.onAction('deploy-diagram', payload);

    setSubmitting(false);

    if (error) {
      await this.logError(error);

      const errorMessage = this.getErrorMessage(error);

      return this.setState({
        success: '',
        error: errorMessage
      });
    }

    // no result if deployment was canceled
    if (!result) {
      return;
    }

    this.setState({
      success: `Successfully deployed diagram to ${payload.endpointUrl}`,
      error: ''
    });
  }

  logError(error) {
    const payload = {
      category: 'deploy-error',
      message: `Deploy error: ${JSON.stringify(error)}`
    };

    return this.props.onAction('log', payload);
  }

  handleFocusChange = event => {
    const isFocusedOnInput = this.isFocusedOnInput(event);

    this.updateMenu(isFocusedOnInput);
  }

  asyncValidateEndpointUrl = async ({ endpointUrl, ...values }) => {
    const baseUrl = this.getBaseUrl(endpointUrl);

    const payload = {
      url: `${baseUrl}${DEPLOY_CHECK_SUFFIX}`,
      auth: this.getAuth(values)
    };

    const response = await this.props.onAction('deploy-check', payload);

    if (!response.ok) {
      const connectionError = this.getConnectionErrorMessage(response.error);

      return this.setState(state => ({ ...state, connectionError: connectionError }));
    }

    this.setState(state => ({ ...state, connectionError: undefined }));
  }

  getConnectionErrorMessage(error) {
    return this.getNetworkErrorMessage(error) ||
      this.getStatusCodeErrorMessage(error) ||
      'Cannot connect to engine for unknown reason.';
  }

  getNetworkErrorMessage(error) {
    switch (error.code) {
    case 'ETIMEDOUT':
    case 'ECONNRESET':
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
      return 'Could not connect to the server. Did you run the engine?';
    }
  }

  getStatusCodeErrorMessage(error) {
    switch (error.status) {
    case 401:
      return 'Connection is unauthorized. Please use valid credentials.';
    case 403:
      return 'Connection is not permitted for your credentials. Please check your credentials.';
    case 404:
      return 'Cannot connect to Camunda. Please check the endpoint URL.';
    case 500:
      return 'Camunda is reporting an unknown error. Please check the server status.';
    case 503:
      return 'Camunda is currently unavailable. Please try again later.';
    }
  }

  validateEndpointUrl = async (url) => {
    if (!url.length) {
      return 'Endpoint URL must not be empty.';
    }

    if (!ENDPOINT_URL_PATTERN.test(url)) {
      return 'Endpoint URL must start with "http://" or "https://".';
    }
  }

  validateDeploymentName = name => {
    if (!name.length) {
      return 'Deployment name must not be empty.';
    }
  }

  validateUsername = username => {
    if (!username.length) {
      return 'Username must not be empty.';
    }
  }

  validatePassword = password => {
    if (!password.length) {
      return 'Password must not be empty.';
    }
  }

  validateBearer = bearer => {
    if (!bearer.length) {
      return 'Token must not be empty.';
    }
  }

  render() {
    const {
      endpoints,
      tab
    } = this.props;

    const deploymentName = tab.name ? withoutExtension(tab.name) : initialFormValues.deploymentName;

    const validators = {
      endpointUrl: this.validateEndpointUrl,
      deploymentName: this.validateDeploymentName,
      username: this.validateUsername,
      password: this.validatePassword,
      bearer: this.validateBearer
    };

    return <View
      onClose={ this.props.onClose }
      onDeploy={ this.handleDeploy }
      onDeployCheck={ debounce(this.asyncValidateEndpointUrl) }
      onFocusChange={ this.handleFocusChange }

      success={ this.state.success }
      error={ this.state.error }
      connectionError={ this.state.connectionError }

      initialValues={ {
        ...initialFormValues,
        deploymentName,
        endpointUrl: endpoints[endpoints.length - 1] || initialFormValues.endpointUrl
      } }
      validators={ validators }
    />;
  }

  updateMenu(enabled = false) {
    const editMenu = getEditMenu(enabled);

    this.props.onMenuUpdate({ editMenu });
  }

  saveEndpoint(endpointUrl) {
    return this.props.onAction('set-endpoints', [ endpointUrl ]);
  }

  getDeploymentPayload(values) {
    const endpointUrl = this.getSanitizedEndpointUrl(values.endpointUrl);

    const payload = {
      endpointUrl,
      deploymentName: values.deploymentName,
      tenantId: values.tenantId
    };

    const auth = this.getAuth(values);

    if (auth) {
      payload.auth = auth;
    }

    return payload;
  }

  /**
   * Appends `/deployment/create` at the end of the url if necessary
   * @param {string} url
   */
  getSanitizedEndpointUrl(url) {
    const baseUrl = this.getBaseUrl(url);

    return `${baseUrl}${ENDPOINT_URL_SUFFIX}`;
  }

  getBaseUrl(url) {
    // remove trailing slash
    if (url[url.length - 1] === '/') {
      url = url.slice(0, -1);
    }

    return url.replace(new RegExp(`${ENDPOINT_URL_SUFFIX}$`), '');
  }

  getAuth({ authType, username, password, bearer }) {
    switch (authType) {
    case AuthTypes.basic:
      return {
        username,
        password
      };
    case AuthTypes.bearer: {
      return {
        bearer
      };
    }
    }
  }

  getErrorMessage(error) {
    for (const getMessage of errorMessageFunctions) {
      const errorMessage = getMessage(error);

      if (errorMessage) {
        return errorMessage;
      }
    }

    return 'Unknown error occurred. Check log for details.';
  }

  /**
   * @param {FocusEvent} event
   * @returns {Boolean}
   */
  isFocusedOnInput(event) {
    return event.type === 'focus' && ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
  }
}

DeployDiagramModal.defaultProps = {
  endpoints: [],
  tab: {},
  onAction: () => ({}),
  onMenuUpdate: () => {}
};

export default DeployDiagramModal;



// helper ////
/**
 * Remove extension from filename
 * @param {string} filename
 */
function withoutExtension(filename) {
  return filename.replace(/^(.+)\.[^.]*$/, '$1');
}
