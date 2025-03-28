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

import { AUTH_TYPES } from '../shared/ZeebeAuthTypes';

import * as TARGET_TYPES from '../shared/ZeebeTargetTypes';

import * as css from './DeploymentConfigForm.less';

const LABELS = {
  SELF_HOSTED_TEXT: 'Camunda 8 Self-Managed',
  NONE: 'None',
  BASIC_AUTH_TEXT: 'Basic',
  OAUTH_TEXT: 'OAuth',
  CAMUNDA_CLOUD_TEXT: 'Camunda 8 SaaS',
  CONTACT_POINT: 'Cluster endpoint',
  BASIC_AUTH_USERNAME: 'Username',
  BASIC_AUTH_PASSWORD: 'Password',
  OAUTH_URL: 'OAuth token URL',
  AUDIENCE: 'OAuth audience',
  SCOPE: 'OAuth scope',
  CLIENT_ID: 'Client ID',
  CLIENT_SECRET: 'Client secret',
  CLUSTER_URL: 'Cluster URL',
  REMEMBER_CREDENTIALS: 'Remember credentials',
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
    renderHeader = null,
    renderSubmit = 'Submit',
    validateForm,
    validateField
  } = props;

  const getFieldError = (meta, fieldName) => {
    return _getFieldError(meta, fieldName) || (meta.touched && meta.error);
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
                    <Section.Header>
                      { renderHeader }
                    </Section.Header>
                  )
                }
                <Section.Body>
                  <fieldset className="fieldset">
                    <div className="fields">
                      <Field
                        name="endpoint.targetType"
                        component={ Radio }
                        label={ 'Target' }
                        className="radio-vertical"
                        values={
                          [
                            { value: TARGET_TYPES.CAMUNDA_CLOUD, label: LABELS.CAMUNDA_CLOUD_TEXT },
                            { value: TARGET_TYPES.SELF_HOSTED, label: LABELS.SELF_HOSTED_TEXT }
                          ]
                        }
                      />
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED && (
                          <React.Fragment>
                            <Field
                              name="endpoint.contactPoint"
                              component={ TextInput }
                              label={ LABELS.CONTACT_POINT }
                              validate={ value => validateField('endpoint.contactPoint', value) }
                              fieldError={ getFieldError }
                              hint={ HINTS.CONTACT_POINT }
                              autoFocus
                            />
                            {
                              props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED
                                && props.values.endpoint.authType === AUTH_TYPES.OAUTH
                                && (
                                  <Field
                                    name="deployment.tenantId"
                                    component={ TextInput }
                                    label={ LABELS.TENANT_ID }
                                    hint="Optional"
                                  />
                                )
                            }
                            <Field
                              name="endpoint.authType"
                              component={ Radio }
                              label={ 'Authentication' }
                              className="radio-horizontal"
                              values={
                                [
                                  { value: AUTH_TYPES.NONE, label: LABELS.NONE },
                                  { value: AUTH_TYPES.BASIC, label: LABELS.BASIC_AUTH_TEXT },
                                  { value: AUTH_TYPES.OAUTH, label: LABELS.OAUTH_TEXT }
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
                                label={ LABELS.AUDIENCE }
                                fieldError={ getFieldError }
                                validate={ value => validateField('endpoint.audience', value) }
                              />
                              <Field
                                name="endpoint.scope"
                                component={ TextInput }
                                label={ LABELS.SCOPE }
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