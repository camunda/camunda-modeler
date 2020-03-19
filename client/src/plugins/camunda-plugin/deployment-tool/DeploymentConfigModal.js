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

import { Modal } from '../../../app/primitives';

import {
  omit
} from 'min-dash';

import css from './DeploymentConfigModal.less';

import AuthTypes from '../shared/AuthTypes';

import {
  CheckBox,
  Radio,
  TextInput
} from '../shared/components';

import {
  Formik,
  Field
} from 'formik';


export default class DeploymentConfigModal extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      isAuthNeeded: false
    };

    this.valuesCache = { ...props.configuration };
  }

  componentDidMount = () => {
    const {
      subscribeToFocusChange
    } = this.props;

    const {
      onAppFocusChange
    } = this;

    subscribeToFocusChange(onAppFocusChange);
  }

  componentWillUnmount = () => {
    this.props.unsubscribeFromFocusChange();
  }

  isConnectionError(code) {
    return code === 'NOT_FOUND' || code === 'CONNECTION_FAILED' || code === 'NO_INTERNET_CONNECTION';
  }

  checkEndpointURLConnectivity = async (skipError) => {
    const {
      valuesCache,
      setFieldErrorCache,
      externalErrorCodeCache,
      isConnectionError,
      checkAuthStatus
    } = this;

    checkAuthStatus(valuesCache);

    if (isConnectionError(externalErrorCodeCache) || skipError) {

      const validationResult = await this.props.validator.validateConnection(valuesCache.endpoint);

      if (!hasKeys(validationResult)) {

        this.externalErrorCodeCache = null;
        this.props.validator.clearEndpointURLError(setFieldErrorCache);
      } else {

        const { code } = validationResult;

        if (isConnectionError(code) && code !== this.externalErrorCodeCache) {
          this.props.validator.updateEndpointURLError(code, setFieldErrorCache);
        }

        this.externalErrorCodeCache = code;
      }
    }
  }

  onSetFieldValueReceived = () => {

    // Initial endpoint URL validation. Note that this is not a form validation
    // and should affect only the Endpoint URL field.
    return this.checkEndpointURLConnectivity(true);
  }

  onAppFocusChange = () => {

    // User may fix connection related errors by focusing out from app (turn on wifi, start server etc.)
    // In that case we want to check if errors are fixed when the users focuses back on to the app.
    return this.checkEndpointURLConnectivity();
  }

  onClose = (action = 'cancel', data = null, shouldOverrideCredentials = false) => {

    if (shouldOverrideCredentials) {

      const { valuesCache } = this;
      const { endpoint } = valuesCache;
      const {
        username, password, token, rememberCredentials
      } = endpoint;

      if (rememberCredentials) {
        this.props.saveCredential({ username, password, token });
      } else {
        this.props.removeCredentials();
      }
    }

    this.props.onClose(action, data);
  }

  onSubmit = async (values, { setFieldError }) => {

    const {
      endpoint
    } = values;

    const connectionValidation = await this.props.validator.validateConnection(endpoint);

    if (!hasKeys(connectionValidation)) {
      this.externalErrorCodeCache = null;
      this.onClose('deploy', values);
    } else {

      const {
        details,
        code
      } = connectionValidation;

      if (code === 'UNAUTHORIZED') {
        this.setState({
          isAuthNeeded: true
        });
      }

      this.externalErrorCodeCache = code;
      this.props.validator.onExternalError(values.endpoint.authType, details, code, setFieldError);
    }
  }

  fieldError = (meta) => {
    return meta.error;
  }

  setAuthType = (form) => {

    return event => {

      const authType = event.target.value;

      const {
        values,
        setValues
      } = form;

      let {
        endpoint
      } = values;

      if (authType !== AuthTypes.basic) {
        endpoint = omit(endpoint, [ 'username', 'password' ]);
      }

      if (authType !== AuthTypes.bearer) {
        endpoint = omit(endpoint, [ 'token' ]);
      }

      setValues({
        ...values,
        endpoint: {
          ...endpoint,
          authType
        }
      });
    };

  }

  onAuthDetection = (isAuthNeeded) => {
    this.setState({
      isAuthNeeded
    });
  }

  checkAuthStatus = (values) => {
    this.props.validator.validateConnectionWithoutCredentials(values.endpoint.url).then((result) => {
      if (!result) {
        this.onAuthDetection(false);
      } else if (!result.isExpired) {
        this.onAuthDetection(!!result && (result.code === 'UNAUTHORIZED'));
      }
    });
  }

  render() {

    const {
      fieldError,
      onSubmit,
      onClose,
      onAuthDetection,
      onSetFieldValueReceived
    } = this;

    const {
      configuration: values,
      validator,
      title,
      intro,
      primaryAction
    } = this.props;

    const {
      isAuthNeeded
    } = this.state;

    return (
      <Modal className={ css.DeploymentConfigModal } onClose={ () => {
        onClose('cancel', null, true);
      } }>

        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
          validateOnBlur={ false }
        >
          { form => {

            this.valuesCache = { ...form.values };
            if (!this.setFieldErrorCache) {
              this.setFieldErrorCache = form.setFieldError;
              onSetFieldValueReceived();
            }

            return (
              <form onSubmit={ form.handleSubmit }>

                <Modal.Title>
                  {
                    title || 'Deploy Diagram'
                  }
                </Modal.Title>

                <Modal.Body>
                  {
                    intro && (
                      <p className="intro">
                        { intro }
                      </p>
                    )
                  }
                  <fieldset>
                    <div className="fields">

                      <Field
                        name="deployment.name"
                        component={ TextInput }
                        label="Deployment Name"
                        fieldError={ fieldError }
                        validate={ (value) => {
                          return validator.validateDeploymentName(value, this.isOnBeforeSubmit);
                        } }
                        autoFocus
                      />

                      <Field
                        name="deployment.tenantId"
                        component={ TextInput }
                        fieldError={ fieldError }
                        hint="Optional"
                        label="Tenant ID"
                      />
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>
                      Endpoint Configuration
                    </legend>

                    <div className="fields">

                      <Field
                        name="endpoint.url"
                        component={ TextInput }
                        fieldError={ fieldError }
                        validate={ (value) => {
                          this.externalErrorCodeCache = null;
                          return validator.validateEndpointURL(
                            value,
                            form.setFieldError,
                            this.isOnBeforeSubmit,
                            onAuthDetection,
                            (code) => { this.externalErrorCodeCache = code; }
                          );
                        } }
                        label="REST Endpoint"
                        hint="Should point to a running Camunda Engine REST API endpoint."
                      />

                      {
                        isAuthNeeded && (
                          <Field
                            name="endpoint.authType"
                            label="Authentication"
                            component={ Radio }
                            onChange={ (event) => {
                              form.handleChange(event);
                              this.setAuthType(form);
                            } }
                            values={
                              [
                                { value: AuthTypes.basic, label: 'HTTP Basic' },
                                { value: AuthTypes.bearer, label: 'Bearer token' }
                              ]
                            }
                          />
                        )
                      }

                      { isAuthNeeded && form.values.endpoint.authType === AuthTypes.basic && (
                        <React.Fragment>
                          <Field
                            name="endpoint.username"
                            component={ TextInput }
                            fieldError={ fieldError }
                            validate={ (value) => {
                              return validator.validateUsername(value || '', this.isOnBeforeSubmit);
                            } }
                            label="Username"
                          />

                          <Field
                            name="endpoint.password"
                            component={ TextInput }
                            fieldError={ fieldError }
                            validate={ (value) => {
                              return validator.validatePassword(value || '', this.isOnBeforeSubmit);
                            } }
                            label="Password"
                            type="password"
                          />
                        </React.Fragment>
                      )}

                      { isAuthNeeded && form.values.endpoint.authType === AuthTypes.bearer && (
                        <Field
                          name="endpoint.token"
                          component={ TextInput }
                          fieldError={ fieldError }
                          validate={ (value) => {
                            return validator.validateToken(value || '', this.isOnBeforeSubmit);
                          } }
                          label="Token"
                        />
                      )}

                      {
                        isAuthNeeded && (
                          <Field
                            name="endpoint.rememberCredentials"
                            component={ CheckBox }
                            type="checkbox"
                            label="Remember credentials"
                          />
                        )
                      }
                    </div>
                  </fieldset>
                </Modal.Body>

                <Modal.Footer>
                  <div className="form-submit">

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={ () => {
                        onClose('cancel', null, false);
                      } }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={ form.isSubmitting }
                      onClick={ () => {

                        // @oguz:
                        // this is a hack as FormIK does not seem to
                        // set isSubmitting when this button is clicked.
                        // if you come up with a better solution, please
                        // do a PR.
                        this.isOnBeforeSubmit = true;
                        setTimeout(() => {
                          this.isOnBeforeSubmit = false;
                        });
                      } }
                    >
                      { primaryAction || 'Deploy' }
                    </button>

                  </div>
                </Modal.Footer>
              </form>
            );
          } }
        </Formik>
      </Modal>
    );
  }
}

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}
