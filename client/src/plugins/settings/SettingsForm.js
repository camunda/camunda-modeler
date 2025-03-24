/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo } from 'react';

import { Field, Form, useFormikContext } from 'formik';
import { Section, TextInput, CheckBox } from '../../shared/ui';

import Flags from '../../util/Flags';

export function SettingsForm(props) {

  const { schema, values, handleClose } = props;

  const { setFieldValue, values: formikValues, submitForm } = useFormikContext();

  useEffect(() => {

    // const flatten = flattenFormikValues(formikValues);
    // const changedFields = Object.keys(flatten).filter(
    //   (key) => flatten[key] !== values[key]
    // );

    // console.log('changedFields', changedFields);

    // setReload(!!changedFields.length);
    submitForm();

  }, [ formikValues ]);

  useEffect(() => {

    Object.entries(values).forEach(([ id, value ]) => {


      setFieldValue(id, value);
    });

  }, [ values ]);

  return (<Form>

    {Object.entries(schema).map(([ id, { title, properties } ]) => (
      <Section key={ id }>
        <Section.Header>{ title }</Section.Header>
        <Section.Body>
          {Object.entries(properties).map(([ key, props ]) => (
            <SettingsField key={ key } name={ key } { ...props } />
          ))}
        </Section.Body>
      </Section>
    ))}

    <Section>
      <Section.Actions>
        <div className="controls">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={ handleClose }
          >
            Close
          </button>
        </div>
      </Section.Actions>
    </Section>
  </Form>);
}

function SettingsField(props) {

  const { name, type, label, description, flag } = props;

  // const [ field, meta ] = useField(props);

  // useEffect(() => {
  //   const { touched } = meta;
  //   if (flag && touched) {
  //     console.log('flag', flag, touched);
  //   }
  // }, [ field, meta ]);

  const flagValue = useMemo(() => {
    return Flags.get(flag);
  }, []);

  const typeProps = useMemo(() => {
    if (type === 'text') {
      return {
        component: TextInput
      };
    }

    if (type === 'boolean') {
      return {
        component: CheckBox,
        type: 'checkbox'
      };
    }

    return null;
  }, [ type ]);

  if (!typeProps) {
    return null;
  }

  return <>
    <Field
      id={ name }
      name={ name }
      label={ label }
      description={ description }
      disabled={ flagValue !== undefined }
      { ...typeProps }
    />
    { flagValue !== undefined &&
      <p className="flag-warning">
        This option is overridden by <code>{ flag }</code> flag. <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/">Learn more.</a>
      </p>
    }
  </>;
}