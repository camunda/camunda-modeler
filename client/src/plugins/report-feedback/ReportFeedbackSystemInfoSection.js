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
  Form
} from 'formik';

import { Checkbox } from '../../shared/ui/primitives';


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
                <Checkbox
                  checked={ formik.values.version }
                  onChange={ (e) => formik.setFieldValue('version', e.target.checked) }
                  label="Version"
                />
                <Checkbox
                  checked={ formik.values.operatingSystem }
                  onChange={ (e) => formik.setFieldValue('operatingSystem', e.target.checked) }
                  label="Operating system"
                />
                <Checkbox
                  checked={ formik.values.installedPlugins }
                  onChange={ (e) => formik.setFieldValue('installedPlugins', e.target.checked) }
                  label="Installed plugins"
                />
                <Checkbox
                  checked={ formik.values.executionPlatform }
                  onChange={ (e) => formik.setFieldValue('executionPlatform', e.target.checked) }
                  label="Execution platform"
                />
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
