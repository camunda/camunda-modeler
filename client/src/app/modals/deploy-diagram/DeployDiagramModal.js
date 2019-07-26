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


const ENDPOINT_URL_PATTERN = /^https?:\/\/.+/;

const ENDPOINT_URL_SUFFIX = '/deployment/create';


const defaultState = {
  success: '',
  error: ''
};

const initialFormValues = {
  endpointUrl: 'http://localhost:8080/engine-rest',
  tenantId: '',
  deploymentName: 'diagram',
  authType: 'none',
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
    const payload = this.getDeploymentPayload(values);

    this.saveEndpoint(values.endpointUrl);

    try {
      const deployResult = await this.props.onDeploy(payload);

      if (!deployResult) {
        setSubmitting(false);

        return;
      }

      this.setState({
        success: `Successfully deployed diagram to ${payload.endpointUrl}`,
        error: ''
      });
    } catch (error) {
      this.props.onDeployError(error);
      const errorMessage = this.getErrorMessage(error);

      this.setState({
        success: '',
        error: errorMessage
      });
    }

    setSubmitting(false);
  }

  handleFocusChange = event => {
    const isFocusedOnInput = this.isFocusedOnInput(event);

    this.updateMenu(isFocusedOnInput);
  }

  validateEndpointUrl = url => {
    if (!url.length) {
      return 'Endpoint URL must not be void.';
    }

    if (!ENDPOINT_URL_PATTERN.test(url)) {
      return 'Endpoint URL must start with "http://" or "https://".';
    }
  }

  validateDeploymentName = name => {
    if (!name.length) {
      return 'Deployment name must not be void.';
    }
  }

  validateUsername = username => {
    if (!username.length) {
      return 'Username must not be void.';
    }
  }

  validatePassword = password => {
    if (!password.length) {
      return 'Password must not be void.';
    }
  }

  validateBearer = bearer => {
    if (!bearer.length) {
      return 'Token must not be void.';
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
      onFocusChange={ this.handleFocusChange }

      success={ this.state.success }
      error={ this.state.error }

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
    this.props.onEndpointsUpdate([ endpointUrl ]);
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
    if (url[url.length - 1] === '/') {
      url = url.slice(0, -1);
    }

    if (url.search(`${ENDPOINT_URL_SUFFIX}$`) === -1) {
      return `${url}${ENDPOINT_URL_SUFFIX}`;
    }

    return url;
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
  onEndpointsUpdate: () => {},
  onDeployError: console.error,
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
