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
  const [message , setDisplayMessage] = useState('');
  let timer;

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);
  const selectedFieldHandler = (event) => {
    let count =0;
    INITIAL_VALUES[event.target.id] = !INITIAL_VALUES[event.target.id];
    for (const property in INITIAL_VALUES) {
      if (INITIAL_VALUES[property]) {
        count++;
      }
    }
    if (count == 0) setDisplayMessage(<h2 className="feedback__message">Select Atleast One checkbox</h2>);
    else setDisplayMessage('');
  };

  const submitForm = (data) => {
    setHasSubmitCompleted(true);
    onSubmit(data);
    timer = setTimeout(function() {
      setHasSubmitCompleted(false);
    }, BUTTON_DISABLED_TIME);
  };

  return (
    <Overlay.Footer>
      <h2 className="overlay__title">
        Don't forget to add system information
      </h2>
      <Formik
        initialValues={ INITIAL_VALUES }
        onSubmit={ submitForm }
      >
        <Form>
          <Field
            name="version"
            component={ CheckBox }
            onClick={ selectedFieldHandler }
            type="checkbox"
            label="Version"
          />
          <Field
            name="operatingSystem"
            component={ CheckBox }
            onClick={ selectedFieldHandler }
            type="checkbox"
            label="Operating System"
          />
          <Field
            name="installedPlugins"
            component={ CheckBox }
            onClick={ selectedFieldHandler }
            type="checkbox"
            label="Installed Plugins"
          />
          <Field
            name="executionPlatform"
            component={ CheckBox }
            onClick={ selectedFieldHandler }
            type="checkbox"
            label="Execution Platform"
          />
          {message}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={ hasSubmitCompleted }
          >
            {!hasSubmitCompleted ? 'Copy to clipboard': 'Copied!' }
          </button>
        </Form>
      </Formik>
    </Overlay.Footer>
  );
}
