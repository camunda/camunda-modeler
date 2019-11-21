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

import { Modal } from '../../app/primitives';

import {
  omit
} from 'min-dash';

import ExpandIcon from 'icons/ChevronDown.svg';
import CollapseIcon from 'icons/ChevronUp.svg';

import css from './DeploymentDetailsModal.less';

import AuthTypes from './AuthTypes';

import {
  CheckBox,
  Select,
  TextInput
} from './components';

import {
  Formik,
  Field
} from 'formik';


export default class DeploymentDetailsModal extends React.PureComponent {

  constructor(props) {
    super(props);

    const {
      validator,
      configuration
    } = props;

    this.state = {
      connectionState: {},
      deploymentDetailsShown: configuration.deployment.tenantId
    };

    this.connectionChecker = validator.createConnectionChecker();
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

  componentDidMount() {
    this.connectionChecker.subscribe({
      onStart: this.handleConnectionCheckStart,
      onComplete: this.handleConnectionChecked
    });
  }

  componentWillUnmount() {
    this.connectionChecker.unsubscribe();
  }

  setConnectionState(connectionState) {
    this.setState({
      connectionState: {
        ...this.state.connectionState,
        ...connectionState
      }
    });
  }

  validate = (values, form) => {

    this.connectionChecker.check(values.endpoint).then(() => {
      return null;
    });
  };

  onClose = (action = 'cancel', data) => this.props.onClose(action, data);

  onCancel = () => this.onClose('cancel');

  onSubmit = (values) => {
    this.onClose('deploy', values);
  }

  fieldError = (meta) => {
    return (this.state.connectionState.isValidated || meta.touched) && meta.error;
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

  toggleDetails = (form) => {

    return (event) => {

      const {
        deployment
      } = form.values;

      if (deployment.tenantId) {
        return;
      }

      this.setState({
        deploymentDetailsShown: !this.state.deploymentDetailsShown
      });
    };
  }

  render() {

    const {
      fieldError,
      onSubmit,
      validate,
      onClose
    } = this;

    const {
      configuration: values,
      validator
    } = this.props;

    const {
      connectionState,
      deploymentDetailsShown
    } = this.state;

    return (
      <Modal className={ css.DeploymentDetailsModal } onClose={ onClose }>

        <Formik
          initialValues={ values }
          validateOnMount={ true }
          validate={ validate }
          onSubmit={ onSubmit }
        >
          { form => (
            <form onSubmit={ form.handleSubmit }>

              <Modal.Title>Deploy Diagram</Modal.Title>

              <Modal.Body>
                <p className="intro">
                  Specify deployment details and deploy this diagram to Camunda.
                </p>

                <fieldset>
                  <legend>
                    Deployment Details
                    <button
                      type="button"
                      className="toggle-details"
                      onClick={ this.toggleDetails(form) }
                      title="Toggle Advanced Details"
                      disabled={ form.values.deployment.tenantId }
                    >
                      {
                        (deploymentDetailsShown)
                          ? <CollapseIcon className="icon" />
                          : <ExpandIcon className="icon" />
                      }
                    </button>
                  </legend>

                  <div className="fields">

                    <Field
                      name="deployment.name"
                      component={ TextInput }
                      label="Name"
                      fieldError={ fieldError }
                      validate={ validator.validateDeploymentName }
                      autoFocus
                    />

                    { deploymentDetailsShown && <Field
                      name="deployment.tenantId"
                      component={ TextInput }
                      fieldError={ fieldError }
                      label="Tenant ID"
                    /> }
                  </div>
                </fieldset>

                <fieldset>
                  <legend>
                    Endpoint Configuration
                  </legend>

                  <ConnectionFeedback connectionState={ connectionState } />

                  <div className="fields">

                    <Field
                      name="endpoint.url"
                      component={ TextInput }
                      fieldError={ fieldError }
                      validate={ validator.validateEndpointURL }
                      label="REST Endpoint"
                      hint="Should point to a running Camunda Engine REST API endpoint."
                    />

                    <Field
                      name="endpoint.authType"
                      label="Authentication"
                      component={ Select }
                      onChange={ this.setAuthType(form) }
                    >
                      <option value={ AuthTypes.none } defaultValue>None</option>
                      <option value={ AuthTypes.basic }>HTTP Basic</option>
                      <option value={ AuthTypes.bearer }>Bearer token</option>
                    </Field>

                    { form.values.endpoint.authType === AuthTypes.basic && (
                      <React.Fragment>
                        <Field
                          name="endpoint.username"
                          component={ TextInput }
                          fieldError={ fieldError }
                          validate={ validator.validateUsername }
                          label="Username"
                        />

                        <Field
                          name="endpoint.password"
                          component={ TextInput }
                          fieldError={ fieldError }
                          validate={ validator.validatePassword }
                          label="Password"
                          type="password"
                        />
                      </React.Fragment>
                    )}

                    { form.values.endpoint.authType === AuthTypes.bearer && (
                      <Field
                        name="endpoint.token"
                        component={ TextInput }
                        fieldError={ fieldError }
                        validate={ validator.validateToken }
                        label="Token"
                      />
                    )}

                    { form.values.endpoint.authType !== AuthTypes.none && (
                      <Field
                        name="endpoint.rememberCredentials"
                        component={ CheckBox }
                        type="checkbox"
                        label="Remember credentials"
                      />
                    )}
                  </div>
                </fieldset>
              </Modal.Body>

              <Modal.Footer>
                <div className="form-submit">

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={ form.isSubmitting }
                  >
                    Deploy
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={ () => onClose('cancel') }
                  >
                    Cancel
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


function ConnectionFeedback(props) {

  const {
    connectionState
  } = props;

  const {
    isValid,
    isValidating,
    isValidated,
    endpointErrors,
    connectionError
  } = connectionState;

  if (!isValidating && !isValidated) {
    return null;
  }

  if (isValidating) {
    return (
      <div className="configuration-status configuration-status__loading">
        Validating connection.
      </div>
    );
  }

  if (isValid) {
    return (
      <div className="configuration-status configuration-status__success">
        Connected successfully.
      </div>
    );
  }

  if (hasKeys(endpointErrors)) {

    const message =
      endpointErrors.url
        ? 'Please provide a valid REST endpoint to test the server connection.'
        : (endpointErrors.token || endpointErrors.username || endpointErrors.password)
          ? 'Please add the credentials to test the server connection'
          : 'Please correct validation errors';

    return (
      <div className="configuration-status configuration-status__hint">
        { message }
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="configuration-status configuration-status__error">
        { connectionError.details }
      </div>
    );
  }

  throw new Error('unexpected connection state');
}

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}
