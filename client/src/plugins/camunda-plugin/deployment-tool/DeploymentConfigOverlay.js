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
  omit
} from 'min-dash';

import * as css from './DeploymentConfigOverlay.less';
import AUTH_TYPES from '../shared/AuthTypes';

import {
  Radio,
  TextInput,
  FileInput,
  Overlay,
  ToggleSwitch,
  Section
} from '../../../shared/ui';

import {
  Formik,
  Field
} from 'formik';
import { GenericApiErrors } from '../shared/RestAPI';

export default class DeploymentConfigOverlay extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      isAuthNeeded: false
    };

    this.valuesCache = { ...props.configuration };
  }

  componentDidMount = () => {
    const {
      subscribeToFocusChange,
      validator
    } = this.props;

    const {
      onAppFocusChange
    } = this;

    subscribeToFocusChange(onAppFocusChange);

    validator.resetCancel();
  };

  componentWillUnmount = () => {
    this.props.unsubscribeFromFocusChange();
  };

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
  };

  onSetFieldValueReceived = () => {

    // Initial endpoint URL validation. Note that this is not a form validation
    // and should affect only the Endpoint URL field.
    return this.checkEndpointURLConnectivity(true);
  };

  onAppFocusChange = () => {

    // User may fix connection related errors by focusing out from app (turn on wifi, start server etc.)
    // In that case we want to check if errors are fixed when the users focuses back on to the app.
    return this.checkEndpointURLConnectivity();
  };

  onClose = (action = 'cancel', data = null, shouldOverrideCredentials = false) => {

    if (shouldOverrideCredentials) {

      const { valuesCache } = this;
      const { endpoint } = valuesCache;
      const {
        username, password, token, rememberCredentials
      } = endpoint;

      if (rememberCredentials) {
        this.props.saveCredentials({ username, password, token });
      } else {
        this.props.removeCredentials();
      }
    }

    this.props.onClose(action, data);
  };

  onSubmit = async (values, { setFieldError }) => {

    const {
      endpoint
    } = values;

    const connectionValidation = await this.props.validator.validateConnection(endpoint);

    if (!hasKeys(connectionValidation)) {

      this.externalErrorCodeCache = null;

      this.onClose('deploy', values, false);

    } else {

      const {
        details,
        code
      } = connectionValidation;

      if (code === GenericApiErrors.UNAUTHORIZED) {
        this.setState({
          isAuthNeeded: true
        });
      }

      this.externalErrorCodeCache = code;
      this.props.validator.onExternalError(values.endpoint.authType, details, code, setFieldError);
    }
  };

  fieldError = (meta) => {
    return meta.error;
  };

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

      if (authType !== AUTH_TYPES.BASIC) {
        endpoint = omit(endpoint, [ 'username', 'password' ]);
      }

      if (authType !== AUTH_TYPES.BEARER) {
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

  };

  onAuthDetection = (isAuthNeeded) => {
    this.setState({
      isAuthNeeded
    });
  };

  checkAuthStatus = (values) => {
    this.props.validator.validateConnectionWithoutCredentials(values.endpoint.url).then((result) => {
      if (!result) {
        this.onAuthDetection(false);
      } else if (!result.isExpired) {
        this.onAuthDetection(!!result && (result.code === GenericApiErrors.UNAUTHORIZED));
      }
    });
  };

  render() {

    const {
      fieldError,
      onSubmit,
      onClose,
      onAuthDetection,
      onSetFieldValueReceived
    } = this;

    const {
      title,
      configuration: values,
      validator,
      primaryAction,
      anchor,
      intro
    } = this.props;

    const {
      isAuthNeeded
    } = this.state;

    return (
      <Overlay className={ css.DeploymentConfigOverlay } onClose={ () => {
        onClose('cancel', null, true, primaryAction);
      } } anchor={ anchor }>

        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
          validateOnBlur={ false }
          validateOnMount
        >
          { form => {

            this.valuesCache = { ...form.values };
            if (!this.setFieldErrorCache) {
              this.setFieldErrorCache = form.setFieldError;
              onSetFieldValueReceived();
            }

            return (
              <form onSubmit={ form.handleSubmit }>

                <Section>

                  <Section.Header>{title || 'Deploy diagram'}</Section.Header>

                  <Section.Body>
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
                          validate={ (value) => {
                            return validator.validateDeploymentName(value, this.hasTriedSubmit);
                          } }
                        >
                          {({ field, form: fieldForm }) => (
                            <TextInput
                              field={ field }
                              form={ fieldForm }
                              label="Deployment name"
                              fieldError={ fieldError }
                              autoFocus
                            />
                          )}
                        </Field>

                        <Field name="deployment.tenantId">
                          {({ field, form: fieldForm }) => (
                            <TextInput
                              field={ field }
                              form={ fieldForm }
                              fieldError={ fieldError }
                              hint="Optional"
                              label="Tenant ID"
                            />
                          )}
                        </Field>

                        <Field
                          name="endpoint.url"
                          validate={ (value) => {
                            this.externalErrorCodeCache = null;
                            return validator.validateEndpointURL(
                              value,
                              form.setFieldError,
                              this.hasTriedSubmit,
                              onAuthDetection,
                              (code) => { this.externalErrorCodeCache = code; }
                            );
                          } }
                        >
                          {({ field, form: fieldForm }) => (
                            <TextInput
                              field={ field }
                              form={ fieldForm }
                              fieldError={ fieldError }
                              label="REST endpoint"
                              hint="Should point to a running Camunda REST API endpoint."
                            />
                          )}
                        </Field>

                        {
                          isAuthNeeded && (
                            <Field name="endpoint.authType">
                              {({ field, form: fieldForm }) => (
                                <Radio
                                  field={ field }
                                  form={ fieldForm }
                                  label="Authentication"
                                  onChange={ (event) => {
                                    form.handleChange(event);
                                    this.setAuthType(form);
                                  } }
                                  values={
                                    [
                                      { value: AUTH_TYPES.BASIC, label: 'HTTP Basic' },
                                      { value: AUTH_TYPES.BEARER, label: 'Bearer token' }
                                    ]
                                  }
                                />
                              )}
                            </Field>
                          )
                        }

                        { isAuthNeeded && form.values.endpoint.authType === AUTH_TYPES.BASIC && (
                          <React.Fragment>
                            <Field
                              name="endpoint.username"
                              validate={ (value) => {
                                return validator.validateUsername(value || '', this.hasTriedSubmit);
                              } }
                            >
                              {({ field, form: fieldForm }) => (
                                <TextInput
                                  field={ field }
                                  form={ fieldForm }
                                  fieldError={ fieldError }
                                  label="Username"
                                />
                              )}
                            </Field>

                            <Field
                              name="endpoint.password"
                              validate={ (value) => {
                                return validator.validatePassword(value || '', this.hasTriedSubmit);
                              } }
                            >
                              {({ field, form: fieldForm }) => (
                                <TextInput
                                  field={ field }
                                  form={ fieldForm }
                                  fieldError={ fieldError }
                                  label="Password"
                                  type="password"
                                />
                              )}
                            </Field>
                          </React.Fragment>
                        )}

                        { isAuthNeeded && form.values.endpoint.authType === AUTH_TYPES.BEARER && (
                          <Field
                            name="endpoint.token"
                            validate={ (value) => {
                              return validator.validateToken(value || '', this.hasTriedSubmit);
                            } }
                          >
                            {({ field, form: fieldForm }) => (
                              <TextInput
                                field={ field }
                                form={ fieldForm }
                                fieldError={ fieldError }
                                label="Token"
                              />
                            )}
                          </Field>
                        )}

                        {
                          isAuthNeeded && (
                            <Field name="endpoint.rememberCredentials">
                              {({ field, form: fieldForm }) => (
                                <ToggleSwitch
                                  field={ field }
                                  form={ fieldForm }
                                  switcherLabel="Remember credentials"
                                />
                              )}
                            </Field>
                          )
                        }
                      </div>
                    </fieldset>
                  </Section.Body>
                </Section>

                <Section relativePos>

                  <Section.Header>
                    Include additional files
                  </Section.Header>

                  <Section.Body>

                    <fieldset>
                      <Field
                        name="deployment.attachments"
                        validate={ validator.validateAttachments }
                      >
                        {({ field, form: fieldForm }) => (
                          <FileInput
                            field={ field }
                            form={ fieldForm }
                            label="Select files"
                          />
                        )}
                      </Field>
                    </fieldset>

                    <Section.Actions>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={ form.isSubmitting }
                        onClick={ () => {
                          this.hasTriedSubmit = true;
                        } }
                      >
                        {
                          primaryAction || 'Deploy'
                        }
                      </button>

                    </Section.Actions>
                  </Section.Body>

                </Section>
              </form>
            );
          } }
        </Formik>
      </Overlay>
    );
  }
}

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}
