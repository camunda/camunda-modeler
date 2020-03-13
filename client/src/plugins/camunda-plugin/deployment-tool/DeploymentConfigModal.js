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
      connectionState: {},
      isAuthNeeded: false
    };

    this.shouldCheckIfAuthNeeded = true;
  }

  handleConnectionCheckStart = () => {
    this.setConnectionState({
      isValidating: true,
      isValidated: false
    });
  }

  handleConnectionChecked = (result) => {

    const {
      endpointErrors,
      connectionError
    } = result;

    this.setConnectionState({
      isValidating: false,
      isValidated: true,
      isValid: !hasKeys(endpointErrors) && !connectionError,
      endpointErrors,
      connectionError
    });
  }

  setConnectionState(connectionState) {
    this.setState({
      connectionState: {
        ...this.state.connectionState,
        ...connectionState
      }
    });
  }

  onClose = (action = 'cancel', data) => this.props.onClose(action, data);

  onCancel = () => this.onClose('cancel');

  onSubmit = async (values, { setFieldError }) => {

    const {
      endpoint
    } = values;

    const connectionValidation = await this.props.validator.validateConnection(endpoint);

    if (!hasKeys(connectionValidation)) {
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

      this.renderConnectionError(values.endpoint.authType, details, code, setFieldError);
    }
  }

  renderConnectionError = (authType, details, code, setFieldError) => {
    if (code === 'UNAUTHORIZED') {
      if (authType === AuthTypes.basic) {
        setFieldError('endpoint.username', details);
        setFieldError('endpoint.password', details);
      } else {
        setFieldError('endpoint.token', details);
      }
    } else {
      setFieldError('endpoint.url', details);
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

  checkAuthStatusOnlyOnce = (values) => {
    if (this.shouldCheckIfAuthNeeded) {
      this.props.validator.validateConnectionWithoutCredentials(values.endpoint.url).then((result) => {
        if (!result) {
          this.onAuthDetection(false);
        } else if (!result.isExpired) {
          this.onAuthDetection(!!result && (result.code === 'UNAUTHORIZED'));
        }
      });
      this.shouldCheckIfAuthNeeded = false;
    }
  }

  render() {

    const {
      fieldError,
      onSubmit,
      onClose,
      onAuthDetection
    } = this;

    const {
      configuration: values,
      validator,
      title,
      intro,
      primaryAction,
      saveCredential,
      removeCredentials
    } = this.props;

    const {
      isAuthNeeded
    } = this.state;

    // @oguz:
    // FormIK validateOnMount get executed only once but not everytime
    // DeploymentConfigModal is mounted. Thats why we need this logic here.
    this.checkAuthStatusOnlyOnce(values);

    return (
      <Modal className={ css.DeploymentConfigModal } onClose={ onClose }>

        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
          validateOnBlur={ false }
        >
          { form => (
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
                        return validator.validateEndpointURL(
                          value,
                          form.setFieldError,
                          this.isOnBeforeSubmit,
                          onAuthDetection
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
                          onChange={ (event) => {
                            form.handleChange(event);
                            if (form.values.endpoint.rememberCredentials) {
                              saveCredential({
                                username: event.target.value
                              });
                            }
                          } }
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
                          onChange={ (event) => {
                            form.handleChange(event);
                            if (form.values.endpoint.rememberCredentials) {
                              saveCredential({
                                password: event.target.value
                              });
                            }
                          } }
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
                        onChange={ (event) => {
                          form.handleChange(event);
                          if (form.values.endpoint.rememberCredentials) {
                            saveCredential({
                              token: event.target.value
                            });
                          }
                        } }
                      />
                    )}

                    {
                      isAuthNeeded && (
                        <Field
                          name="endpoint.rememberCredentials"
                          component={ CheckBox }
                          type="checkbox"
                          label="Remember credentials"
                          onChange={ async (event) => {
                            form.handleChange(event);
                            const {
                              endpoint
                            } = form.values;

                            const {
                              username,
                              password,
                              token,
                              authType
                            } = endpoint;
                            const isChecked = !JSON.parse(event.target.value);
                            if (isChecked) {
                              if (authType == AuthTypes.basic) {
                                saveCredential({ username, password });
                              } else if (authType == AuthTypes.bearer) {
                                saveCredential({ token });
                              }
                            } else {
                              removeCredentials();
                            }
                          } }
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
                    onClick={ () => onClose('cancel') }
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
          )}
        </Formik>
      </Modal>
    );
  }
}

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}
