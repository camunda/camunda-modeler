/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect } from 'react';

import { Field, Form, useFormikContext } from 'formik';
import { Section, TextInput, CheckBox } from '../../shared/ui';


export function SettingsForm(props) {

  const { schema, values } = props;

  const { setFieldValue } = useFormikContext();

  useEffect(() => {

    Object.entries(values).forEach(([ id, value ]) => {
      console.log('set',
        id,
        value
      );
      setFieldValue(id, value);
    });

  }, [ values ]);

  return (<Form>

    {Object.entries(schema).map(([ id, { title, properties } ]) => (
      <Section key={ id }>
        <Section.Header>{ title }</Section.Header>
        <Section.Body>
          {Object.entries(properties).map(([ key, props ]) => (
            <SettingsField key={ key } id={ key } { ...props } />
          ))}
        </Section.Body>
      </Section>
    ))}

    <Section>
      <Section.Actions>
        <div className="controls">
          <button
            className="btn btn-primary"
            type="submit"

            // disabled={ form.isSubmitting }
          >
            Save
          </button>
        </div>
      </Section.Actions>
    </Section>
  </Form>);
}

function SettingsField(props) {

  const { id, type, label, description } = props;

  if (type === 'text') {
    return <Field
      id={ id }
      name={ id }
      label={ label }
      description={ description }
      component={ TextInput }
    />;
  }

  if (type === 'boolean') {
    return <Field
      id={ id }
      name={ id }
      component={ CheckBox }
      type="checkbox"
      label={ label }
      description={ description }
    />;
  }

  return null;
}