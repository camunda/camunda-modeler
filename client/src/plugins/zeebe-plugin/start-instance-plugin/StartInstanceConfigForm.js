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
  JSONInput,
  Section
} from '../../../shared/ui';

import {
  Field,
  Form,
  Formik
} from 'formik';
import { getMessageForReason } from '../shared/util';
import FormFeedback from '../../../shared/ui/form/FormFeedback';

import { utmTag } from '../../../util/utmTag';

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
    handleChangeConnections,
    handleManageConnections
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
                        component={ VariablesComponent }
                        label="Variables (optional)"
                        description={ <span>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href={ utmTag('https://docs.camunda.io/docs/components/concepts/variables/') }>Zeebe variables</a>.</span> }
                        hint="A JSON string representing the variables the process instance is started with."
                        validate={ value => validateField('variables', value) }
                        fieldError={ getFieldError }
                        { ...variablesComponentProps }
                      />
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
                            <a href="#" onClick={ handleChangeConnections }>Change</a> or <a href="#" onClick={ handleManageConnections }>manage connection.</a>
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
