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
  Field,
  Form,
  Formik
} from 'formik';

import {
  Radio,
  Section,
  Select,
  TextInput,
  ToggleSwitch
} from '../../../shared/ui';

import { AUTH_TYPES, TARGET_TYPES } from '../../../remote/ZeebeAPI';

import * as css from './DeploymentConfigForm.less';

const LABELS = {
  AUTH_TYPE_BASIC_AUTH: 'Basic',
  AUTH_TYPE_NONE: 'None',
  AUTH_TYPE_OAUTH: 'OAuth',
  BASIC_AUTH_PASSWORD: 'Password',
  BASIC_AUTH_USERNAME: 'Username',
  CAMUNDA_CLOUD: 'Camunda 8 SaaS',
  CLIENT_ID: 'Client ID',
  CLIENT_SECRET: 'Client secret',
  CLUSTER_URL: 'Cluster URL',
  CONTACT_POINT: 'Cluster endpoint',
  OAUTH_AUDIENCE: 'OAuth audience',
  OAUTH_SCOPE: 'OAuth scope',
  OAUTH_URL: 'OAuth token URL',
  REMEMBER_CREDENTIALS: 'Remember credentials',
  SELF_HOSTED: 'Camunda 8 Self-Managed',
  TENANT_ID: 'Tenant ID'
};

const HINTS = {
  CONTACT_POINT: 'http://localhost:26500'
};

export default function DeploymentConfigForm(props) {
  const {
    getFieldError: _getFieldError,
    initialFieldValues,
    onSubmit,
    renderDescription = null,
    renderHeader = null,
    renderSubmit = 'Submit',
    validateForm,
    validateField,
    connections
  } = props;

  const getFieldError = (meta, fieldName) => {
    return _getFieldError(fieldName) || (meta.touched && meta.error);
  };

  return (
    <Formik
      initialValues={ initialFieldValues }
      onSubmit={ onSubmit }
      validate={ validateForm }
      validateOnBlur
      validateOnMount
    >
      {
        props => {
          return (
            <Form className={ css.DeploymentConfigForm }>
              <Section>
                {
                  renderHeader && (
                    <Section.Header className="form-header">
                      Select Connection
                    </Section.Header>
                  )
                }


                <Section.Body className="form-description">
                  TODO Text: Select a connection for the current opened file.
                  <br></br>
                  <a href="https://docs.camunda.org/manual/latest/user-guide/tasklist/#connecting-to-a-process-engine">Manage Connections</a>


                  <div className="form-group" style={ { marginTop:'16px' } }>
                    <select name="connection" className="form-control">
                      {connections.map(connection => (
                        <option key={ connection.id } value={ connection.id }>
                          {connection.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </Section.Body>


              </Section>
            </Form>
          );
        }
      }
    </Formik>
  );
}
