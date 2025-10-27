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
  OAUTH_AUDIENCE: 'OAuth audience',
  OAUTH_SCOPE: 'OAuth scope',
  OAUTH_URL: 'OAuth token URL',
  OPERATE_URL: 'Operate URL',
  REMEMBER_CREDENTIALS: 'Remember credentials',
  SELF_HOSTED: 'Camunda 8 Self-Managed',
  TENANT_ID: 'Tenant ID'
};

const HINTS = {
  CLUSTER_URL: 'http://localhost:26500'
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
    validateField
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
                      { renderHeader }
                    </Section.Header>
                  )
                }
                {
                  renderDescription && (
                    <Section.Body className="form-description">
                      { renderDescription }
                    </Section.Body>
                  )
                }
                <Section.Body className="form-body">
                  <fieldset className="fieldset">
                    <div className="fields">
                      <Field
                        name="endpoint.targetType"
                        component={ Radio }
                        label={ 'Target' }
                        className="radio-vertical"
                        values={
                          [
                            { value: TARGET_TYPES.CAMUNDA_CLOUD, label: LABELS.CAMUNDA_CLOUD },
                            { value: TARGET_TYPES.SELF_HOSTED, label: LABELS.SELF_HOSTED }
                          ]
                        }
                      />
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED && (
                          <React.Fragment>
                            <Field
                              name="endpoint.contactPoint"
                              component={ TextInput }
                              label={ LABELS.CLUSTER_URL }
                              validate={ value => validateField('endpoint.contactPoint', value) }
                              fieldError={ getFieldError }
                              hint={ HINTS.CLUSTER_URL }
                              autoFocus
                            />
                            <Field
                              name="deployment.tenantId"
                              component={ TextInput }
                              label={ LABELS.TENANT_ID }
                              hint="Optional"
                            />
                            <Field
                              name="endpoint.operateUrl"
                              component={ TextInput }
                              label={ LABELS.OPERATE_URL }
                              hint="Optional"
                            />
                            <Field
                              name="endpoint.authType"
                              component={ Radio }
                              label={ 'Authentication' }
                              className="radio-horizontal"
                              values={
                                [
                                  { value: AUTH_TYPES.NONE, label: LABELS.AUTH_TYPE_NONE },
                                  { value: AUTH_TYPES.BASIC, label: LABELS.AUTH_TYPE_BASIC_AUTH },
                                  { value: AUTH_TYPES.OAUTH, label: LABELS.AUTH_TYPE_OAUTH }
                                ]
                              }
                            />
                          </React.Fragment>
                        )
                      }
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED
                          && props.values.endpoint.authType === AUTH_TYPES.BASIC
                          && (
                            <React.Fragment>
                              <Field
                                name="endpoint.basicAuthUsername"
                                component={ TextInput }
                                label={ LABELS.BASIC_AUTH_USERNAME }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.basicAuthUsername', value) }
                              />
                              <Field
                                name="endpoint.basicAuthPassword"
                                component={ TextInput }
                                label={ LABELS.BASIC_AUTH_PASSWORD }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.basicAuthPassword', value) }
                                type="password"
                              />
                            </React.Fragment>
                          )
                      }
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED
                          && props.values.endpoint.authType === AUTH_TYPES.OAUTH
                          && (
                            <React.Fragment>
                              <Field
                                name="endpoint.clientId"
                                component={ TextInput }
                                label={ LABELS.CLIENT_ID }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.clientId', value) }
                              />
                              <Field
                                name="endpoint.clientSecret"
                                component={ TextInput }
                                label={ LABELS.CLIENT_SECRET }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.clientSecret', value) }
                                type="password"
                              />
                              <Field
                                name="endpoint.oauthURL"
                                component={ TextInput }
                                label={ LABELS.OAUTH_URL }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.oauthURL', value) }
                              />
                              <Field
                                name="endpoint.audience"
                                component={ TextInput }
                                label={ LABELS.OAUTH_AUDIENCE }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.audience', value) }
                              />
                              <Field
                                name="endpoint.scope"
                                component={ TextInput }
                                label={ LABELS.OAUTH_SCOPE }
                              />
                            </React.Fragment>
                          )
                      }
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.CAMUNDA_CLOUD && (
                          <React.Fragment>
                            <Field
                              name="endpoint.camundaCloudClusterUrl"
                              component={ TextInput }
                              label={ LABELS.CLUSTER_URL }
                              fieldError={ getFieldError }
                              validate={ value => validateField('endpoint.camundaCloudClusterUrl', value) }
                            />
                            <Field
                              name="endpoint.camundaCloudClientId"
                              component={ TextInput }
                              label={ LABELS.CLIENT_ID }
                              fieldError={ getFieldError }
                              validate={ value => validateField('endpoint.camundaCloudClientId', value) }
                            />
                            <Field
                              name="endpoint.camundaCloudClientSecret"
                              component={ TextInput }
                              label={ LABELS.CLIENT_SECRET }
                              fieldError={ getFieldError }
                              validate={ value => validateField('endpoint.camundaCloudClientSecret', value) }
                              type="password"
                            />
                          </React.Fragment>
                        )
                      }
                      <Field
                        name={ 'endpoint.rememberCredentials' }
                        component={ ToggleSwitch }
                        switcherLabel={ LABELS.REMEMBER_CREDENTIALS }
                      />
                    </div>
                  </fieldset>
                  <Section.Actions>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={ props.isSubmitting }
                    >
                      { renderSubmit }
                    </button>
                  </Section.Actions>
                </Section.Body>
              </Section>
            </Form>
          );
        }
      }
    </Formik>
  );
}