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

  render() {

    const {
      fieldError,
      onSubmit,
      onClose
    } = this;

    const {
      configuration: values,
      validator,
      title,
      intro,
      primaryAction
    } = this.props;

    return (
      <Modal className={ css.DeploymentConfigModal } onClose={ onClose }>

        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
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
                      validate={ validator.validateDeploymentName }
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
                      validate={ validator.validateEndpointURL }
                      label="REST Endpoint"
                      hint="Should point to a running Camunda Engine REST API endpoint."
                    />

                    <Field
                      name="endpoint.authType"
                      label="Authentication"
                      component={ Radio }
                      onChange={ this.setAuthType(form) }
                      values={
                        [
                          { value: AuthTypes.basic, label: 'HTTP Basic' },
                          { value: AuthTypes.bearer, label: 'Bearer token' }
                        ]
                      }
                    />

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

                    <Field
                      name="endpoint.rememberCredentials"
                      component={ CheckBox }
                      type="checkbox"
                      label="Remember credentials"
                    />
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
