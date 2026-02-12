/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect } from 'react';

import { Section } from '../../shared/ui';

import {
  Formik,
  Form,
  Field
} from 'formik';

import {
  CheckBox
} from '../../shared/ui';


const INITIAL_VALUES = {
  version: true,
  operatingSystem: true,
  installedPlugins: true,
  executionPlatform: true
};

const BUTTON_DISABLED_TIME = 3000;


export function ReportFeedbackSystemInfoSection(props) {
  const {
    onSubmit
  } = props;

  const [ hasSubmitCompleted, setHasSubmitCompleted ] = useState(false);
  let timer;

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const submitForm = (data) => {
    setHasSubmitCompleted(true);
    onSubmit(data);
    timer = setTimeout(function() {
      setHasSubmitCompleted(false);
    }, BUTTON_DISABLED_TIME);
  };
  function allFieldsTruthy(object) {
    for (const field in object) {
      if (!object[field]) {
        return false;
      }
    }
    return true;
  }
  const validateFormData = values => {
    const errors = {};
    if (!Object.values(values).some(v => v)) {
      errors._form = 'Select at least one checkbox.';
    }
    return errors;
  };

  return (
    <Section>
      <Section.Header>
        Share your system information
      </Section.Header>
      <Section.Body>
        <Formik
          initialValues={ INITIAL_VALUES }
          onSubmit={ submitForm }
          validate={ validateFormData }
        >
          {formik => {
            return (
              <Form>
                <Field name="version">
                  {({ field, form }) => (
                    <CheckBox
                      field={ field }
                      form={ form }
                      type="checkbox"
                      label="Version"
                    />
                  )}
                </Field>
                <Field name="operatingSystem">
                  {({ field, form }) => (
                    <CheckBox
                      field={ field }
                      form={ form }
                      type="checkbox"
                      label="Operating system"
                    />
                  )}
                </Field>
                <Field name="installedPlugins">
                  {({ field, form }) => (
                    <CheckBox
                      field={ field }
                      form={ form }
                      type="checkbox"
                      label="Installed plugins"
                    />
                  )}
                </Field>
                <Field name="executionPlatform">
                  {({ field, form }) => (
                    <CheckBox
                      field={ field }
                      form={ form }
                      type="checkbox"
                      label="Execution platform"
                    />
                  )}
                </Field>
                {formik.errors._form && allFieldsTruthy(formik.touched) && <div className="feedback__message">{formik.errors._form}</div>}

                <Section.Actions>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={ hasSubmitCompleted }
                  >
                    {!hasSubmitCompleted ? 'Copy system information' : 'Copied!' }
                  </button>
                </Section.Actions>
              </Form>
            );
          }}
        </Formik>
      </Section.Body>
    </Section>
  );
}
