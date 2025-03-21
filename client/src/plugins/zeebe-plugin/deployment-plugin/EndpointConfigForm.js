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

import * as css from './DeploymentPlugin.less';

export default function EndpointConfigForm(props) {
  const {
    getFieldError: _getFieldError,
    initialFieldValues,
    onSubmit,
    renderHeader = null,
    renderSubmit = 'Submit',
    validateFieldValue
  } = props;

  const getFieldError = (meta, fieldName) => {
    return _getFieldError(fieldName) || (meta.touched && meta.error);
  };

  return (
    <Formik
      initialValues={ initialFieldValues }
      onSubmit={ onSubmit }
      validate={ validateFieldValue }
      validateOnMount
    >
      {
        props => (
          <form
            className={ css.EndpointConfigForm }
            onSubmit={ onSubmit }>
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
                      name="targetType"
                      component={ Radio }
                      label={ 'Target' }
                      className="target_radio"
                      values={
                        [
                          { value: TARGET_TYPES.CAMUNDA_CLOUD, label: CONSTANTS.CAMUNDA_CLOUD_TEXT },
                          { value: TARGET_TYPES.SELF_HOSTED, label: CONSTANTS.SELF_HOSTED_TEXT }
                        ]
                      }
                    />
                    {
                      props.values.targetType === CONSTANTS.SELF_HOSTED && (
                        <React.Fragment>
                          <Field
                            name="contactPoint"
                            component={ TextInput }
                            label={ CONSTANTS.CONTACT_POINT }
                            validate={ value => validateFieldValue('contactPoint', value) }
                            fieldError={ getFieldError }
                            hint={ CONSTANTS.CONTACT_POINT_HINT }
                            autoFocus
                          />
                          {
                            props.values.targetType === CONSTANTS.SELF_HOSTED
                              && props.values.authType === AUTH_TYPES.OAUTH
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
                            name="authType"
                            component={ Radio }
                            label={ 'Authentication' }
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
                      props.values.targetType === CONSTANTS.SELF_HOSTED
                        && props.values.authType === AUTH_TYPES.BASIC
                        && (
                          <React.Fragment>
                            <Field
                              name="basicAuthUsername"
                              component={ TextInput }
                              label={ CONSTANTS.BASIC_AUTH_USERNAME }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('basicAuthUsername', value) }
                            />
                            <Field
                              name="basicAuthPassword"
                              component={ TextInput }
                              label={ CONSTANTS.BASIC_AUTH_PASSWORD }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('basicAuthPassword', value) }
                              type="password"
                            />
                          </React.Fragment>
                        )
                    }
                    {
                      props.values.targetType === CONSTANTS.SELF_HOSTED
                        && props.values.authType === AUTH_TYPES.OAUTH
                        && (
                          <React.Fragment>
                            <Field
                              name="clientId"
                              component={ TextInput }
                              label={ CONSTANTS.CLIENT_ID }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('clientId', value) }
                            />
                            <Field
                              name="clientSecret"
                              component={ TextInput }
                              label={ CONSTANTS.CLIENT_SECRET }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('clientSecret', value) }
                              type="password"
                            />
                            <Field
                              name="oauthURL"
                              component={ TextInput }
                              label={ CONSTANTS.OAUTH_URL }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('oauthURL', value) }
                            />
                            <Field
                              name="audience"
                              component={ TextInput }
                              label={ CONSTANTS.AUDIENCE }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('audience', value) }
                            />
                            <Field
                              name="scope"
                              component={ TextInput }
                              label={ CONSTANTS.SCOPE }
                              fieldError={ getFieldError }
                              validate={ value => validateFieldValue('scope', value) }
                            />
                          </React.Fragment>
                        )
                    }
                    {
                      props.values.targetType === CONSTANTS.CAMUNDA_CLOUD && (
                        <React.Fragment>
                          <Field
                            name="camundaCloudClusterUrl"
                            component={ TextInput }
                            label={ CONSTANTS.CLUSTER_URL }
                            fieldError={ getFieldError }
                            validate={ value => validateFieldValue('camundaCloudClusterUrl', value) }
                          />
                          <Field
                            name="camundaCloudClientId"
                            component={ TextInput }
                            label={ CONSTANTS.CLIENT_ID }
                            fieldError={ getFieldError }
                            validate={ value => validateFieldValue('camundaCloudClientId', value) }
                          />
                          <Field
                            name="camundaCloudClientSecret"
                            component={ TextInput }
                            label={ CONSTANTS.CLIENT_SECRET }
                            fieldError={ getFieldError }
                            validate={ value => validateFieldValue('camundaCloudClientSecret', value) }
                            type="password"
                          />
                        </React.Fragment>
                      )
                    }
                    <Field
                      name={ 'rememberCredentials' }
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
          </form>
        )
      }
    </Formik>
  );
}