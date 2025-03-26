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

import * as CONSTANTS from './DeploymentPluginConstants';

import { AUTH_TYPES } from '../shared/ZeebeAuthTypes';

import * as TARGET_TYPES from '../shared/ZeebeTargetTypes';

import * as css from './EndpointConfigForm.less';

export default function EndpointConfigForm(props) {
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
            <Form className={ css.EndpointConfigForm }>
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
                            { value: TARGET_TYPES.CAMUNDA_CLOUD, label: CONSTANTS.CAMUNDA_CLOUD_TEXT },
                            { value: TARGET_TYPES.SELF_HOSTED, label: CONSTANTS.SELF_HOSTED_TEXT }
                          ]
                        }
                      />
                      {
                        props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED && (
                          <React.Fragment>
                            <Field
                              name="endpoint.contactPoint"
                              component={ TextInput }
                              label={ CONSTANTS.CONTACT_POINT }
                              validate={ value => validateField('contactPoint', value) }
                              fieldError={ getFieldError }
                              hint={ CONSTANTS.CONTACT_POINT_HINT }
                              autoFocus
                            />
                            {
                              props.values.endpoint.targetType === TARGET_TYPES.SELF_HOSTED
                                && props.values.endpoint.authType === AUTH_TYPES.OAUTH
                                && (
                                  <Field
                                    name="deployment.tenantId"
                                    component={ TextInput }
                                    label={ CONSTANTS.TENANT_ID }
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
                                  { value: AUTH_TYPES.NONE, label: CONSTANTS.NONE },
                                  { value: AUTH_TYPES.BASIC, label: CONSTANTS.BASIC_AUTH_TEXT },
                                  { value: AUTH_TYPES.OAUTH, label: CONSTANTS.OAUTH_TEXT }
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
                                label={ CONSTANTS.BASIC_AUTH_USERNAME }
                                fieldError={ getFieldError }
                                validate={ value => validateField('basicAuthUsername', value) }
                              />
                              <Field
                                name="endpoint.basicAuthPassword"
                                component={ TextInput }
                                label={ CONSTANTS.BASIC_AUTH_PASSWORD }
                                fieldError={ getFieldError }
                                validate={ value => validateField('basicAuthPassword', value) }
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
                                label={ CONSTANTS.CLIENT_ID }
                                fieldError={ getFieldError }
                                validate={ value => validateField('clientId', value) }
                              />
                              <Field
                                name="endpoint.clientSecret"
                                component={ TextInput }
                                label={ CONSTANTS.CLIENT_SECRET }
                                fieldError={ getFieldError }
                                validate={ value => validateField('clientSecret', value) }
                                type="password"
                              />
                              <Field
                                name="endpoint.oauthURL"
                                component={ TextInput }
                                label={ CONSTANTS.OAUTH_URL }
                                fieldError={ getFieldError }
                                validate={ value => validateField('oauthURL', value) }
                              />
                              <Field
                                name="endpoint.audience"
                                component={ TextInput }
                                label={ CONSTANTS.AUDIENCE }
                                fieldError={ getFieldError }
                                validate={ value => validateField('audience', value) }
                              />
                              <Field
                                name="endpoint.scope"
                                component={ TextInput }
                                label={ CONSTANTS.SCOPE }
                                fieldError={ getFieldError }
                                validate={ value => validateField('scope', value) }
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
                              label={ CONSTANTS.CLUSTER_URL }
                              fieldError={ getFieldError }
                              validate={ value => validateField('camundaCloudClusterUrl', value) }
                            />
                            <Field
                              name="endpoint.camundaCloudClientId"
                              component={ TextInput }
                              label={ CONSTANTS.CLIENT_ID }
                              fieldError={ getFieldError }
                              validate={ value => validateField('camundaCloudClientId', value) }
                            />
                            <Field
                              name="endpoint.camundaCloudClientSecret"
                              component={ TextInput }
                              label={ CONSTANTS.CLIENT_SECRET }
                              fieldError={ getFieldError }
                              validate={ value => validateField('camundaCloudClientSecret', value) }
                              type="password"
                            />
                          </React.Fragment>
                        )
                      }
                      <Field
                        name={ 'endpoint.rememberCredentials' }
                        component={ ToggleSwitch }
                        switcherLabel={ CONSTANTS.REMEMBER_CREDENTIALS }
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