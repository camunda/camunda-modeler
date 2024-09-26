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

// import {
//   omit
// } from 'min-dash';

// import * as css from './DeploymentConfigOverlay.less';
// import AUTH_TYPES from '../shared/AuthTypes';

import {
  TextInput,
  Section
} from '../../../../../shared/ui';

import {
  Formik,
  Field
} from 'formik';
import { runFile } from '../Deployment/API';
import { useLocalState } from '../useLocalState';

export default function RunForm(props) {
  const {
    onClose,
    getValue,
    name,
    setIsRunning,
    setOutput,
    id
  } = props;

  const [ values, setValues ] = useLocalState(id + 'robotTab', {
    'name': name.split('.')[0],
    'endpoint': 'http://localhost:36227/',
    'variables': ''
  });

  const onSubmit = async (values, ...rest) => {
    setValues(values);
    setIsRunning(true);
    onClose();
    const response = await runFile({
      ...values,
      script: getValue()
    });

    setIsRunning(false);
    setOutput(response);

  };

  return (<Formik
    initialValues={ values }
    onSubmit={ onSubmit }
    validateOnBlur={ false }
    validateOnMount
  >
    { form => {
      return (
        <form onSubmit={ form.handleSubmit }>

          <Section>

            <Section.Header>Run Script</Section.Header>

            <Section.Body>

              <fieldset>
                <div className="fields">

                  <Field
                    name="name"
                    component={ TextInput }
                    label={ 'Script Name' }
                    hint={ 'Used to reference the script in your BPMN' }
                  />

                  <Field
                    name="endpoint"
                    component={ TextInput }
                    label={ 'Endpoint URL' }
                    validate={ validateEndpointURL }
                    fieldError={ fieldError }
                  />

                  <Field
                    name="variables"
                    component={ TextInput }
                    multiline={ true }
                    label="Variables (optional)"
                    description={ <p>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href="https://docs.camunda.io/docs/components/concepts/variables/?utm_source=modeler&utm_medium=referral">Zeebe variables</a>.</p> }
                    hint="A JSON string representing the variables the script will be called withk."
                    validate={ (value) => {
                      if (value && value.trim().length > 0) {
                        console.log('validate', value);
                        try {
                          JSON.parse(value);
                        } catch (e) {
                          console.log('not valid JSON');
                          return 'Variables is not a valid JSON';
                        }
                        return null;
                      }
                    } }
                    fieldError={ fieldError }
                    spellcheck="false"
                  />

                </div>
              </fieldset>
            </Section.Body>
            <Section.Actions>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={ form.isSubmitting }
              >
                Run
              </button>
            </Section.Actions>

          </Section>
        </form>
      );
    } }
  </Formik>);
}


const fieldError = (meta) => {
  console.log('fieldError', meta);
  return meta.error;
};


const validateEndpointURL = async (value) => {
  try {
    const response = await fetch(value + 'status');
    console.log(response);
  } catch (error) {
    console.error(error);
    return 'Could not connect to RPA runtine. Make sure the RPA runtime is running.';
  }
};

// const validateVariables = async (value) => {
//   try {
//     JSON.parse(value);
//   } catch (error) {
//     return 'Invalid JSON';
//   }
// };