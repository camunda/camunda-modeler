import React from 'react';

import View from './View';

import errorMessageFunctions from './error-messages';


const ENDPOINT_URL_PATTERN = /^https?:\/\/.+/;

const ENDPOINT_URL_SUFFIX = '/deployment/create';


const defaultState = {
  success: '',
  error: ''
};

class DeployDiagramModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = defaultState;
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

  render() {
    const { endpoints } = this.props;
    return <View
      onClose={ this.props.onClose }
      onDeploy={ this.handleDeploy }

      success={ this.state.success }
      error={ this.state.error }

      initialValues={ {
        endpointUrl: endpoints[endpoints.length - 1] || '',
        tenantId: '',
        deploymentName: ''
      } }
      validateEndpointUrl={ this.validateEndpointUrl }
      validateDeploymentName={ this.validateDeploymentName }
    />;
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

  getErrorMessage(error) {
    for (const getMessage of errorMessageFunctions) {
      const errorMessage = getMessage(error);

      if (errorMessage) {
        return errorMessage;
      }
    }

    return 'Unknown error occurred. Check log for details.';
  }
}

DeployDiagramModal.defaultProps = {
  endpoints: [],
  onEndpointsUpdate: () => {},
  onDeployError: console.error
};

export default DeployDiagramModal;
