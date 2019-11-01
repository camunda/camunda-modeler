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

import css from './DeploymentDetailsModal.less';

import AuthTypes from './AuthTypes';

import {
  FormControl
} from './components';

import {
  Field,
  Form,
  Formik
} from 'formik';


export default class RunDetailsModal extends React.PureComponent {

  state = {
    detailsOpen: false,
    checkingConnection: null,
    connectionError: null,
    connectionHint: null,
    lastPassword: null,
    lastUsername: null,
    lastAuthType: null
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  validate = values => {
    const errors = this.props.validate(values);

    return errors;
  }

  getEndpointConfigHint(values, errors) {
    const areCredentialsMissing = this.getCredentialsConfigFields(values.authType)
      .some(field => errors[field]);

    if (errors.endpointUrl && areCredentialsMissing) {
      return 'Please finish the endpoint configuration to test the server connection.';
    }

    if (errors.endpointUrl) {
      return 'Please provide a valid REST endpoint to test the server connection.';
    }

    if (areCredentialsMissing) {
      return 'Please add the credentials to test the server connection.';
    }

    return null;
  }

  getCredentialsConfigFields(authType) {
    switch (authType) {
    case AuthTypes.none:
      return [];
    case AuthTypes.bearer:
      return [ 'bearer' ];
    case AuthTypes.basic:
      return [ 'username', 'password' ];
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
      details: initialValues,
      onFocusChange
    } = this.props;

    const onClose = this.onClose;
    const onSubmit = this.onSubmit;

    return (
      <Modal className={ css.DeploymentDetailsModal } onClose={ onClose }>
        <Formik
          initialValues={ initialValues }
          onSubmit={ onSubmit }
          validate={ this.validate }
        >
          {({ isSubmitting }) => (
            <Form>
              <Modal.Header>
                <Modal.Title>
                  Run Process Instance
                </Modal.Title>

                <Modal.Close onClick={ onClose }></Modal.Close>
              </Modal.Header>

              <Modal.Body>

                <p className="intro">
                  Start a Process Instance on the <a href="https://camunda.com/products/bpmn-engine/">Camunda Engine</a>.
                </p>

                <fieldset>

                  <legend>
                    Run Details
                  </legend>

                  <div className="fields">
                    <Field
                      name="businessKey"
                      component={ FormControl }
                      label="Business Key"
                      validated
                      autoFocus
                      onFocusChange={ onFocusChange }
                    />
                  </div>
                </fieldset>

              </Modal.Body>
              <Modal.Footer>

                <div className="form-submit">

                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={ onClose }
                  >
                  Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={ isSubmitting }>
                  Run
                  </button>
                </div>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    );
  }
}