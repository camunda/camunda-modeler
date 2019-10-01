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

import { debounce } from 'min-dash';

import { Modal } from '../../app/primitives';

import css from './DeploymentDetailsModal.less';

import AuthTypes from './AuthTypes';

import {
  AuthBasic,
  AuthBearer,
  FormControl
} from './components';

import {
  Formik,
  Form,
  Field
} from 'formik';

import { ConnectionErrorMessages } from './errors';


const initialFormValues = {
  endpointUrl: 'http://localhost:8080/engine-rest',
  tenantId: '',
  deploymentName: 'diagram',
  authType: AuthTypes.none,
  username: '',
  password: '',
  bearer: ''
};

export default class DeploymentDetailsModal extends React.PureComponent {

  state = {
    detailsOpen: false,
    checkingConnection: null,
    connectionError: null,
    lastPassword: null,
    lastUsername: null,
    lastAuthType: null
  }

  componentDidMount() {
    this.mounted = true;

    // check connection with pre-validated initial form values
    const initialValues = this.getInitialValues();
    const errors = this.props.validate(initialValues);

    this.checkConnectionIfNeeded(initialValues, errors, true);
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  getInitialValues() {
    return { ...initialFormValues, ...this.props.details };
  }

  checkConnection = async values => {
    if (!this.mounted || this.state.checkingConnection) {
      return;
    }

    this.setState({
      checkingConnection: true,
      lastUsername: values.username,
      lastPassword: values.password,
      lastAuthType: values.authType
    });

    const connectionError = await this.props.checkConnection(values);

    this.mounted && this.setState({ connectionError, checkingConnection: false });
  }

  lazilyCheckConnection = debounce(this.checkConnection, 1000);

  moreLazilyCheckConnection = debounce(this.checkConnection, 2000);

  validate = values => {
    const errors = this.props.validate(values);

    this.checkConnectionIfNeeded(values, errors);

    return errors;
  }

  checkConnectionIfNeeded(values, errors, immediately = false) {

    // skip connection check in case of invalid input
    if (this.getEndpointConfigFields(values.authType).some(field => errors[field])) {
      return;
    }

    if (immediately) {
      return this.checkConnection(values);
    }

    const {
      authType,
      username,
      password
    } = values;

    if (authType !== AuthTypes.basic || authType !== this.state.lastAuthType) {
      return this.lazilyCheckConnection(values);
    }

    const usernameOrPasswordChanged = !(
      username === this.state.lastUsername && password === this.state.lastPassword
    );

    const previouslyUnauthorized = this.state.connectionError === ConnectionErrorMessages.unauthorized;

    // skip connection check if already failed for provided credentials
    if (!usernameOrPasswordChanged && previouslyUnauthorized) {
      return;
    }

    // apply longer delay if unauthorized during last check
    if (previouslyUnauthorized) {
      return this.moreLazilyCheckConnection(values);
    }

    return this.lazilyCheckConnection(values);
  }

  getEndpointConfigFields(authType) {
    switch (authType) {
    case AuthTypes.none:
      return [ 'endpointUrl' ];
    case AuthTypes.bearer:
      return [ 'endpointUrl', 'bearer' ];
    case AuthTypes.basic:
      return [ 'endpointUrl', 'username', 'password' ];
    }
  }

  onClose = () => this.props.onClose();

  onSubmit = (values, { setSubmitting }) => {
    if (this.state.connectionError) {
      return setSubmitting(false);
    }

    this.props.onClose(values);
  }

  toggleDetails = () => this.setState(state => ({ ...state, detailsOpen: !state.detailsOpen }));

  render() {
    const {
      onFocusChange
    } = this.props;

    const initialValues = this.getInitialValues();

    const { checkingConnection, connectionError, detailsOpen } = this.state;

    const onClose = this.onClose;

    return (
      <Modal className={ css.DeploymentDetailsModal } onClose={ onClose }>
        <h2>Deploy Diagram</h2>

        <p className="intro">
          Specify deployment details and deploy this diagram to Camunda.
        </p>

        <Formik
          initialValues={ initialValues }
          onSubmit={ this.onSubmit }
          validate={ this.validate }
        >
          {({ isSubmitting, values }) => (
            <React.Fragment>

              <Form>

                <fieldset>

                  <legend>
                    Deployment Details
                    <button
                      type="button"
                      className="toggle-details"
                      onClick={ !values['tenantId'] && this.toggleDetails }
                      title="Toggle Advanced Details"
                      disabled={ values['tenantId'] }
                    >
                      { (detailsOpen || values['tenantId']) ? '-' : '+' }
                    </button>
                  </legend>

                  <div className="fields">
                    <Field
                      name="deploymentName"
                      component={ FormControl }
                      label="Name"
                      validated
                      autoFocus
                      onFocusChange={ onFocusChange }
                    />

                    { (detailsOpen || values['tenantId']) && <Field
                      name="tenantId"
                      component={ FormControl }
                      label="Tenant ID"
                      onFocusChange={ onFocusChange }
                    /> }
                  </div>

                </fieldset>

                <fieldset>

                  <legend>Endpoint Configuration</legend>

                  <ConnectionCheckResult
                    checkingConnection={ checkingConnection }
                    connectionError={ connectionError }
                  />

                  <div className="fields">
                    <Field
                      name="endpointUrl"
                      component={ FormControl }
                      label="REST Endpoint"
                      hint="Should point to a running Camunda Engine REST API endpoint."
                      validated
                      onFocusChange={ onFocusChange }
                    />

                    <div>
                      <label htmlFor="authType">Authentication</label>
                    </div>

                    <div>
                      <Field name="authType" component="select">
                        <option value={ AuthTypes.none } defaultValue>None</option>
                        <option value={ AuthTypes.basic }>HTTP Basic</option>
                        <option value={ AuthTypes.bearer }>Bearer token</option>
                      </Field>
                    </div>

                    { values.authType === AuthTypes.basic && (
                      <AuthBasic onFocusChange={ onFocusChange } />) }

                    { values.authType === AuthTypes.bearer && (
                      <AuthBearer onFocusChange={ onFocusChange } />) }
                  </div>
                </fieldset>

                <div className="form-submit">
                  <button
                    type="submit"
                    disabled={ isSubmitting }>
                    Deploy
                  </button>

                  <button
                    type="button"
                    onClick={ onClose }>
                    Cancel
                  </button>
                </div>
              </Form>

            </React.Fragment>
          )}

        </Formik>

      </Modal>
    );
  }
}


function ConnectionCheckResult({ checkingConnection, connectionError }) {
  if (connectionError) {
    return (
      <div className="configuration-status configuration-status__error">
        { connectionError }
      </div>
    );
  }

  if (checkingConnection === false) {
    return (
      <div className="configuration-status configuration-status__success">
        Connected successfully.
      </div>
    );
  }

  return (
    <div className="configuration-status configuration-status__placeholder" />
  );
}
