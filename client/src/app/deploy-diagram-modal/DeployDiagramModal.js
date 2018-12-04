import React from 'react';

import View from './View';

import errorMessageFunctions from './error-messages';


const ENDPOINT_URL_PATTERN = /^https?:\/\/.+/;


const defaultState = {
  isFormValid: false,
  isLoading: false,
  success: '',
  error: '',
  endpointUrl: '',
  endpointUrlError: '',
  endpointUrlTouched: false,
  tenantId: '',
  deploymentName: '',
  deploymentNameError: '',
  deploymentNameTouched: false
};

class DeployDiagramModal extends React.Component {
  constructor(props) {
    super();

    const { endpoints } = props;

    this.state = {
      ...defaultState,
      endpointUrl: endpoints[endpoints.length - 1] || ''
    };
  }

  componentDidMount() {
    this.validateForm();
  }

  handleDeploy = async (event) => {
    event.preventDefault();

    if (!this.state.isFormValid) {
      return;
    }

    this.setState({
      success: '',
      error: '',
      isLoading: true
    });

    const payload = this.getDeploymentPayload();

    this.saveEndpoint(payload.endpointUrl);

    try {
      const deployResult = await this.props.onDeploy(payload);

      if (!deployResult) {
        this.setState({ isLoading: false });

        return;
      }

      this.setState({
        isLoading: false,
        success: `Successfully deployed diagram to ${payload.endpointUrl}`,
        error: ''
      });
    } catch (error) {
      this.props.onDeployError(error);
      const errorMessage = this.getErrorMessage(error);

      this.setState({
        isLoading: false,
        success: '',
        error: errorMessage
      });
    }
  }

  handleEndpointUrlChange = event => this.setState({ endpointUrl: event.target.value });

  handleTenantIdChange = event => this.setState({ tenantId: event.target.value });

  handleDeploymentNameChange = event => this.setState({ deploymentName: event.target.value });

  handleEndpointUrlTouch = () => {
    this.setState({ endpointUrlTouched: true });
    this.validateForm();
  };

  handleDeploymentNameTouch = () => {
    this.setState({ deploymentNameTouched: true });
    this.validateForm();
  };

  render() {
    return <View
      onClose={ this.props.onClose }
      onDeploy={ this.handleDeploy }
      onEndpointUrlChange={ this.handleEndpointUrlChange }
      onEndpointUrlTouch={ this.handleEndpointUrlTouch }
      onTenantIdChange={ this.handleTenantIdChange }
      onDeploymentNameChange={ this.handleDeploymentNameChange }
      onDeploymentNameTouch={ this.handleDeploymentNameTouch }

      isFormValid={ this.state.isFormValid }
      isLoading={ this.state.isLoading }
      success={ this.state.success }
      error={ this.state.error }
      endpointUrl={ this.state.endpointUrl }
      endpointUrlError={ this.state.endpointUrlError }
      endpointUrlTouched={ this.state.endpointUrlTouched }
      tenantId={ this.state.tenantId }
      deploymentName={ this.state.deploymentName }
      deploymentNameError={ this.state.deploymentNameError }
      deploymentNameTouched={ this.state.deploymentNameTouched }
    />;
  }

  saveEndpoint(endpointUrl) {
    this.props.onEndpointsUpdate([ endpointUrl ]);
  }

  getDeploymentPayload() {
    const payload = {
      endpointUrl: this.state.endpointUrl,
      deploymentName: this.state.deploymentName,
      tenantId: this.state.tenantId
    };

    return payload;
  }

  getErrorMessage(error) {
    let errorMessage;

    for (const getMessage of errorMessageFunctions) {
      errorMessage = getMessage(error);

      if (errorMessage) {
        return errorMessage;
      }
    }

    return 'Unknown error occurred.';
  }

  validateForm = () => {
    const validationResults = {
      endpointUrlError: this.validateEndpointUrl(),
      deploymentNameError: this.validateDeploymentName()
    };
    let isFormValid = true;

    for (const errorField in validationResults) {
      if (validationResults[errorField]) {
        isFormValid = false;
        break;
      }
    }

    this.setState({
      ...validationResults,
      isFormValid
    });
  }

  validateEndpointUrl = () => {
    const url = this.state.endpointUrl;

    if (!url.length) {
      return 'Endpoint URL must not be void';
    }

    if (!ENDPOINT_URL_PATTERN.test(url)) {
      return 'Endpoint URL must start with "http://" or "https://';
    }
  }

  validateDeploymentName = () => {
    const name = this.state.deploymentName;

    if (!name.length) {
      return 'Deployment name must not be void';
    }
  }
}

DeployDiagramModal.defaultProps = {
  endpoints: [],
  onEndpointsUpdate: () => {},
  onDeployError: console.error
};

export default DeployDiagramModal;
