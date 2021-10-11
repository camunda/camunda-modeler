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

import { Overlay } from '../../shared/ui';

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


export function ReportFeedbackSystemInfo(props) {
  const { onSubmit } = props;

  const [hasSubmitCompleted, setHasSubmitCompleted] = useState(false);
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
  const validateFormData = values => {
    const errors = {};
    if (!values.installedPlugins && !values.version && !values.operatingSystem && !values.executionPlatform) {
      errors.installedPlugins = 'Please Select Atleast one Checkbox';
    }
    return errors;
  };

  return (
    <Overlay.Footer>
      <h2 className="overlay__title">
        Don't forget to add system information
      </h2>
      <Formik
        initialValues={ INITIAL_VALUES }
        onSubmit={ submitForm }
        validate={ validateFormData }
      >
        {formik => {
          return (
            <Form>
              <Field
                name="version"
                component={ CheckBox }
                type="checkbox"
                label="Version"
              />
              <Field
                name="operatingSystem"
                component={ CheckBox }
                type="checkbox"
                label="Operating System"
              />
              <Field
                name="installedPlugins"
                component={ CheckBox }
                type="checkbox"
                label="Installed Plugins"
              />
              <Field
                name="executionPlatform"
                component={ CheckBox }
                type="checkbox"
                label="Execution Platform"
              />
              {formik.errors.installedPlugins && formik.touched.installedPlugins && <div className="feedback__message">{formik.errors.installedPlugins}</div>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={ hasSubmitCompleted }
                onClick={ () => formik.validateForm() }
              >
                {!hasSubmitCompleted ? 'Copy to clipboard': 'Copied!' }
              </button>
            </Form>
          );
        }}
      </Formik>
    </Overlay.Footer>
  );
}
