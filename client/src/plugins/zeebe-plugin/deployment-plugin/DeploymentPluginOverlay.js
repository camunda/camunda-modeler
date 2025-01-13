/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  OVERLAY_TITLE,
  DEPLOY,
  NEXT,
  DEPLOYMENT_NAME,
  SELF_HOSTED_TEXT,
  NONE,
  BASIC_AUTH_TEXT,
  OAUTH_TEXT,
  CAMUNDA_CLOUD_TEXT,
  CONTACT_POINT,
  DEPLOYMENT_NAME_HINT,
  CONTACT_POINT_HINT,
  BASIC_AUTH_USERNAME,
  BASIC_AUTH_PASSWORD,
  OAUTH_URL,
  AUDIENCE,
  SCOPE,
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET,
  CLUSTER_URL,
  REMEMBER_CREDENTIALS,
  ERROR_REASONS,
  CONNECTION_ERROR_MESSAGES,
  TROUBLESHOOTING_URL
} from './DeploymentPluginConstants';

import { AUTH_TYPES } from './../shared/ZeebeAuthTypes';

import {
  SELF_HOSTED,
  CAMUNDA_CLOUD
} from '../shared/ZeebeTargetTypes';

import {
  Formik,
  Field
} from 'formik';

import {
  Overlay,
  ToggleSwitch,
  Radio,
  TextInput,
  Section
} from '../../../shared/ui';

import * as css from './DeploymentPluginOverlay.less';


const CONNECTION_STATE = {
  INITIAL: 'initial',
  INVALID_ENDPOINT: 'invalidEndpoint',
  ERROR: 'error',
  CONNECTED: 'connected'
};

export default class DeploymentPluginOverlay extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      connectionState: { type: CONNECTION_STATE.INITIAL },
      configValues: {}
    };

    const { validator } = props;

    this.validatorFunctionsByFieldNames = {
      contactPoint: validator.validateZeebeContactPoint,
      basicAuthUsername: validator.validateBasicAuthUsername,
      basicAuthPassword: validator.validateBasicAuthPassword,
      oauthURL: validator.validateOAuthURL,
      audience: validator.validateAudience,
      scope: validator.validateScope,
      clientId: validator.validateClientId,
      clientSecret: validator.validateClientSecret,
      camundaCloudClientId: validator.validateClientId,
      camundaCloudClientSecret: validator.validateClientSecret,
      camundaCloudClusterUrl: validator.validateClusterUrl
    };

    this.connectionChecker = validator.createConnectionChecker();
  }

  async componentDidMount() {
    this.connectionChecker.subscribe({
      onComplete: this.handleConnectionCheckResult
    });
  }

  componentWillUnmount() {
    this.connectionChecker.unsubscribe();
  }

  endpointConfigurationFieldError = (meta, fieldName) => {
    return this.getConnectionError(fieldName) || (meta.touched && meta.error);
  };

  getConnectionError(rawFieldName) {
    const { connectionState } = this.state;

    // no connection error
    if (connectionState.type !== CONNECTION_STATE.ERROR) {
      return;
    }

    const fieldName = rawFieldName.replace('endpoint.', '');
    const { failureReason } = connectionState;

    switch (failureReason) {
    case ERROR_REASONS.CONTACT_POINT_UNAVAILABLE:
      return fieldName === 'contactPoint' &&
        <>
          { CONNECTION_ERROR_MESSAGES[failureReason] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
        </>;
    case ERROR_REASONS.CLUSTER_UNAVAILABLE:
      return fieldName === 'camundaCloudClusterUrl' &&
        <>
          { CONNECTION_ERROR_MESSAGES[failureReason] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
        </>;
    case ERROR_REASONS.UNSUPPORTED_ENGINE:
      return [
        'contactPoint',
        'camundaCloudClusterUrl'
      ].includes(fieldName) && CONNECTION_ERROR_MESSAGES[failureReason];
    case ERROR_REASONS.UNAUTHORIZED:
    case ERROR_REASONS.FORBIDDEN:
      return [
        'clientId',
        'clientSecret',
        'camundaCloudClientId',
        'camundaCloudClientSecret',
        'audience',
        'scope'
      ].includes(fieldName) && CONNECTION_ERROR_MESSAGES[failureReason];
    case ERROR_REASONS.OAUTH_URL:
      return fieldName === 'oauthURL' && CONNECTION_ERROR_MESSAGES[failureReason];
    case ERROR_REASONS.UNKNOWN:
      return [
        'contactPoint',
        'camundaCloudClusterUrl',
        'oauthURL'
      ].includes(fieldName) &&
        <>
          { CONNECTION_ERROR_MESSAGES[failureReason] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
        </>;
    case ERROR_REASONS.INVALID_CLIENT_ID:
      return fieldName === 'camundaCloudClientId' && CONNECTION_ERROR_MESSAGES[failureReason];
    case ERROR_REASONS.INVALID_CREDENTIALS:
      return fieldName === 'camundaCloudClientSecret' && CONNECTION_ERROR_MESSAGES[failureReason];
    }
  }

  scheduleConnectionCheck = formValues => {
    const { endpoint } = formValues;

    // empty scope shall not be passed
    if (!endpoint.scope) {
      delete endpoint.scope;
    }

    this.connectionChecker.check(endpoint);

    this.setState({ configValues: formValues });
  };

  handleConnectionCheckResult = result => {
    const { connectionResult, endpointErrors } = result;

    if (endpointErrors) {
      return this.setConnectionState({ type: CONNECTION_STATE.INVALID_ENDPOINT });
    }

    if (!connectionResult.success) {
      return this.setConnectionState({
        type: CONNECTION_STATE.ERROR,
        failureReason: connectionResult.reason
      });
    }

    return this.setConnectionState({ type: CONNECTION_STATE.CONNECTED });
  };

  setConnectionState(connectionState) {
    this.setState({ connectionState });
  }

  handleFormSubmit = async (values, { setSubmitting }) => {
    const {
      deployment,
      endpoint
    } = values;

    // Extract clusterId and clusterRegion as required by zeebeAPI for camundaCloud
    if (endpoint.targetType === CAMUNDA_CLOUD && endpoint.camundaCloudClusterUrl) {
      endpoint.camundaCloudClusterId = extractClusterId(endpoint.camundaCloudClusterUrl);
      endpoint.camundaCloudClusterRegion = extractClusterRegion(endpoint.camundaCloudClusterUrl);
    }

    if (!endpoint.scope) {
      delete endpoint.scope;
    }

    if (endpoint.authType === AUTH_TYPES.NONE) {
      delete deployment.tenantId;
    }

    // check connection
    const { connectionResult } = await this.connectionChecker.check(endpoint);

    if (!connectionResult.success) {
      return setSubmitting(false);
    }

    this.props.onDeploy(values);
  };

  render() {

    const {
      onClose: closeOverlay,
      config,
      isStart,
      anchor
    } = this.props;

    const onClose = () => closeOverlay(this.state.configValues, 'cancel');

    const {
      validatorFunctionsByFieldNames
    } = this;

    return (
      <Overlay className={ css.DeploymentPluginOverlay } onClose={ onClose } anchor={ anchor }>
        <Formik
          initialValues={ config }
          onSubmit={ this.handleFormSubmit }
          validate={ this.scheduleConnectionCheck }
          validateOnMount
        >
          {
            form => (
              <form onSubmit={ form.handleSubmit }>
                <Section>
                  <Section.Header>{ OVERLAY_TITLE }</Section.Header>
                  <Section.Body>
                    <fieldset className="fieldset">
                      <div className="fields">
                        <Field
                          name="deployment.name"
                          component={ TextInput }
                          label={ DEPLOYMENT_NAME }
                          hint={ DEPLOYMENT_NAME_HINT }
                          autoFocus
                        />
                        <Field
                          name="endpoint.targetType"
                          component={ Radio }
                          label={ 'Target' }
                          className="target_radio"
                          values={
                            [
                              { value: CAMUNDA_CLOUD, label: CAMUNDA_CLOUD_TEXT },
                              { value: SELF_HOSTED, label: SELF_HOSTED_TEXT }
                            ]
                          }
                        />
                        {
                          form.values.endpoint.targetType === SELF_HOSTED && (
                            <React.Fragment>
                              <Field
                                name="endpoint.contactPoint"
                                component={ TextInput }
                                label={ CONTACT_POINT }
                                validate={ validatorFunctionsByFieldNames.contactPoint }
                                fieldError={ this.endpointConfigurationFieldError }
                                hint={ CONTACT_POINT_HINT }
                                autoFocus
                              />
                              {
                                form.values.endpoint.targetType === SELF_HOSTED &&
                                  form.values.endpoint.authType === AUTH_TYPES.OAUTH && (
                                  <Field
                                    name="deployment.tenantId"
                                    component={ TextInput }
                                    label={ TENANT_ID }
                                    hint="Optional"
                                  />
                                )
                              }
                              <Field
                                name="endpoint.authType"
                                component={ Radio }
                                label={ 'Authentication' }
                                values={
                                  [
                                    { value: AUTH_TYPES.NONE, label: NONE },
                                    { value: AUTH_TYPES.BASIC, label: BASIC_AUTH_TEXT },
                                    { value: AUTH_TYPES.OAUTH, label: OAUTH_TEXT }
                                  ]
                                }
                              />
                            </React.Fragment>
                          )
                        }
                        {
                          form.values.endpoint.targetType === SELF_HOSTED &&
                            form.values.endpoint.authType === AUTH_TYPES.BASIC && (
                            <React.Fragment>
                              <Field
                                name="endpoint.basicAuthUsername"
                                component={ TextInput }
                                label={ BASIC_AUTH_USERNAME }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.basicAuthUsername }
                              />
                              <Field
                                name="endpoint.basicAuthPassword"
                                component={ TextInput }
                                label={ BASIC_AUTH_PASSWORD }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.basicAuthPassword }
                                type="password"
                              />
                            </React.Fragment>
                          )
                        }
                        {
                          form.values.endpoint.targetType === SELF_HOSTED &&
                            form.values.endpoint.authType === AUTH_TYPES.OAUTH && (
                            <React.Fragment>
                              <Field
                                name="endpoint.clientId"
                                component={ TextInput }
                                label={ CLIENT_ID }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.clientId }
                              />
                              <Field
                                name="endpoint.clientSecret"
                                component={ TextInput }
                                label={ CLIENT_SECRET }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.clientSecret }
                                type="password"
                              />
                              <Field
                                name="endpoint.oauthURL"
                                component={ TextInput }
                                label={ OAUTH_URL }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.oauthURL }
                              />
                              <Field
                                name="endpoint.audience"
                                component={ TextInput }
                                label={ AUDIENCE }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.audience }
                              />
                              <Field
                                name="endpoint.scope"
                                component={ TextInput }
                                label={ SCOPE }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.scope }
                              />
                            </React.Fragment>
                          )
                        }
                        {
                          form.values.endpoint.targetType === CAMUNDA_CLOUD && (
                            <React.Fragment>
                              <Field
                                name="endpoint.camundaCloudClusterUrl"
                                component={ TextInput }
                                label={ CLUSTER_URL }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.camundaCloudClusterUrl }
                              />
                              <Field
                                name="endpoint.camundaCloudClientId"
                                component={ TextInput }
                                label={ CLIENT_ID }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.camundaCloudClientId }
                              />
                              <Field
                                name="endpoint.camundaCloudClientSecret"
                                component={ TextInput }
                                label={ CLIENT_SECRET }
                                fieldError={ this.endpointConfigurationFieldError }
                                validate={ validatorFunctionsByFieldNames.camundaCloudClientSecret }
                                type="password"
                              />
                            </React.Fragment>
                          )
                        }
                        <Field
                          name={ 'endpoint.rememberCredentials' }
                          component={ ToggleSwitch }
                          switcherLabel={ REMEMBER_CREDENTIALS }
                        />
                      </div>
                    </fieldset>
                    <Section.Actions>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={ form.isSubmitting }
                      >
                        { isStart ? NEXT : DEPLOY }
                      </button>
                    </Section.Actions>

                  </Section.Body>
                </Section>
              </form>
            )
          }
        </Formik>
      </Overlay>
    );
  }
}


// helper ////////

/**
  * extractClusterId
  *
  * @param  {string} camundaCloudClusterUrl
  * @return {string} camundaCloudClusterId
  */
function extractClusterId(camundaCloudClusterUrl) {
  const matches = camundaCloudClusterUrl.match(/([a-z\d]+-){2,}[a-z\d]+/g);
  return matches ? matches[0] : null;
}


/**
 * extractClusterRegion
 *
 * @param  {type} camundaCloudClusterUrl
 * @return {type} camundaCloudClusterRegion
 */
function extractClusterRegion(camundaCloudClusterUrl) {
  const matches = camundaCloudClusterUrl.match(/(?<=\.)[a-z]+-[\d]+/g);
  return matches ? matches[0] : null;
}
