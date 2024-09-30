/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'camunda-modeler-plugin-helpers/react';

// import { TextInput, Section } from 'camunda-modeler-plugin-helpers/components';
const { TextInput, Section } = window.components;

import {
  Formik,
  Field
} from 'formik';
import { deployFile } from './API';
import { useLocalState } from '../useLocalState';


export default function DeploymentForm(props) {
  const {
    onClose,
    getValue,
    name,
    id,
    onAction
  } = props;

  console.log(id + 'robotTab');

  const [ defaultValues, setValues ] = useLocalState(id + 'robotTab', {
    'name': name.split('.')[0],
    'endpoint': 'http://localhost:36227/',
    'variables': ''
  });


  const onSubmit = async (values, ...rest) => {
    setValues({ ...defaultValues, ...values });
    await deployFile({
      ...values,
      script: getValue()
    });

    onClose();
    onAction('display-notification', {
      type: 'success',
      title: 'Script deployed',
      content: `The script "${values.name}" was successfully deployed.`
    });
  };

  return (<Formik
    initialValues={ defaultValues }
    onSubmit={ onSubmit }
    validateOnBlur={ false }
    validateOnMount
  >
    { form => {
      return (
        <form onSubmit={ form.handleSubmit }>

          <Section>

            <Section.Header>Deploy Script</Section.Header>

            <Section.Body>

              <fieldset>
                <div className="fields">

                  <Field
                    name="name"
                    component={ TextInput }
                    label={ 'Script Name' }
                    hint={ 'Script Name' }
                    description={ 'Used to reference the robot script in your BPMN' }
                  />

                  <Field
                    name="endpoint"
                    component={ TextInput }
                    label={ 'Endpoint URL' }
                    validate={ validateEndpointURL }
                    fieldError={ fieldError }
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
                Deploy
                {/* { isStart ? NEXT : DEPLOY } */}
              </button>
            </Section.Actions>

          </Section>
        </form>
      );
    } }
  </Formik>);
}


const fieldError = (meta) => {
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