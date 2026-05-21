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

import semver from 'semver';

import {
  JSONInput,
  Section,
  TextInput,
  DefinitionTooltip
} from '../../../shared/ui';

import {
  Field,
  Form,
  Formik
} from 'formik';

import { getMessageForReason } from '../shared/util';

import FormFeedback from '../../../shared/ui/form/FormFeedback';

import { utmTag } from '../../../util/utmTag';

const MIN_VERSION_SUPPORTING_BUSINESS_ID = '8.9.0';

export default function StartInstanceConfigForm(props) {
  const {
    getFieldError: _getFieldError,
    initialFieldValues,
    onSubmit,
    renderDescription = null,
    renderHeader = null,
    renderSubmit = 'Submit',
    validateForm,
    validateField,
    VariablesComponent = JSONInput,
    variablesComponentProps = {},
    connectionCheckResult,
    hasLintErrors = false,
    handleChangeConnections,
    handleManageConnections,
    handleOpenLintingPanel
  } = props;

  const businessIdUnsupported = isBusinessIdUnsupportedInConnectedCluster(connectionCheckResult);

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
            <Form>
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
                        name="variables"
                        validate={ value => validateField('variables', value) }
                      >
                        {({ field, form }) => (
                          <VariablesComponent
                            field={ field }
                            form={ form }
                            label={
                              <>
                                <DefinitionTooltip
                                  definition={
                                    <p>
                                      JSON data passed into the process instance at startup. Variables can drive routing decisions, feed
                                      service tasks, and be read or updated throughout the process.{ ' ' }
                                      <a
                                        href={ utmTag('https://docs.camunda.io/docs/components/concepts/variables') }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Learn more.
                                      </a>
                                    </p>
                                  }
                                >
                                  Variables
                                </DefinitionTooltip>
                                { ' ' }(optional)
                              </>
                            }
                            description={ <span>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href={ utmTag('https://docs.camunda.io/docs/components/concepts/variables/') }>Zeebe variables</a>.</span> }
                            hint="A JSON string representing the variables the process instance is started with."
                            fieldError={ getFieldError }
                            { ...variablesComponentProps }
                          />
                        )}
                      </Field>
                      <Field
                        name="businessId"
                        validate={ value => validateField('businessId', value) }
                      >
                        {({ field, form }) => {
                          return (
                            <TextInput
                              field={ field }
                              form={ form }
                              label={
                                <>
                                  <DefinitionTooltip
                                    definition={
                                      <p>
                                        Assign an ID from your own systems (e.g., an order or case number) to this instance for easier lookup,
                                        tracing, and duplicate prevention.{ ' ' }
                                        <a
                                          href={ utmTag('https://docs.camunda.io/docs/components/concepts/process-instance-creation/#business-id') }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Learn more.
                                        </a>
                                      </p>
                                    }
                                  >
                                    Business ID
                                  </DefinitionTooltip>
                                  { ' ' }(optional)
                                </>
                              }
                              description={ businessIdUnsupported && field.value
                                ? <span className="version-hint">Requires Camunda { MIN_VERSION_SUPPORTING_BUSINESS_ID } or later</span>
                                : null
                              }
                              hint="A unique identifier for the process instance."
                              fieldError={ getFieldError }
                            />
                          );
                        }}
                      </Field>
                    </div>
                  </fieldset>
                  <Section.Actions>
                    <div className="form-group">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={ props.isSubmitting }>
                        { renderSubmit }
                      </button>
                      { connectionCheckResult?.success === false && (
                        <FormFeedback
                          error={ <>
                            Could not establish connection: <br />
                            { getMessageForReason(connectionCheckResult?.reason) } <br />
                            <a href="#" onClick={ handleChangeConnections }>Change</a> or <a href="#" onClick={ handleManageConnections }>manage connections.</a>
                          </> }
                        />
                      )}
                      { connectionCheckResult?.success !== false && hasLintErrors && (
                        <FormFeedback
                          error={ <>
                            Diagram has errors. <a href="#" onClick={ handleOpenLintingPanel }>Show errors.</a>
                          </> }
                        />
                      )}
                    </div>
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

function isBusinessIdUnsupportedInConnectedCluster(connectionCheckResult) {
  if (!connectionCheckResult?.success) {
    return false;
  }

  const gatewayVersion = connectionCheckResult?.response?.gatewayVersion;

  if (!gatewayVersion) {
    return false;
  }

  const coercedVersion = semver.coerce(gatewayVersion);

  return semver.compare(coercedVersion || '0', MIN_VERSION_SUPPORTING_BUSINESS_ID) < 0;
}
