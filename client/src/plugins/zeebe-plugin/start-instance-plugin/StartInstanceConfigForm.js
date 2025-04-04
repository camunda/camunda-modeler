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
  TextInput,
  Section
} from '../../../shared/ui';

import {
  Field,
  Form,
  Formik
} from 'formik';

export default function StartInstanceConfigForm(props) {
  const {
    initialFieldValues,
    onSubmit,
    renderHeader = null,
    renderSubmit = 'Submit',
    validateForm,
    validateField
  } = props;

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
                    <Section.Header>
                      { renderHeader }
                    </Section.Header>
                  )
                }
                <Section.Body>
                  <fieldset className="fieldset">
                    <div className="fields">
                      <Field
                        name="variables"
                        component={ TextInput }
                        multiline={ true }
                        label="Variables (optional)"
                        description={ <span>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href="https://docs.camunda.io/docs/components/concepts/variables/?utm_source=modeler&utm_medium=referral">Zeebe variables</a>.</span> }
                        hint="A JSON string representing the variables the process instance is started with."
                        validate={ value => validateField('variables', value) }
                        spellCheck={ false }
                      />
                    </div>
                  </fieldset>
                  <Section.Actions>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={ props.isSubmitting }>
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
