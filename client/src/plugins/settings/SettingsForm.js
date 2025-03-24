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

import { map, forEach } from 'min-dash';

import { Section, TextInput, CheckBox, Select } from '../../shared/ui';

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
    forEach(values, (value, key) => {
      setFieldValue(key, value);
    });
  }, [ values ]);

  return (<Form>
    {
      map(schema, (value, key) =>
        <SettingsSection key={ key } { ...value } />)
    }
  </Form>);
}

function SettingsSection(props) {

  const { title, properties } = props;

  return (
    <Section>
      <Section.Header>{ title }</Section.Header>
      <Section.Body>
        {
          map(properties, (props, key) =>
            <SettingsField key={ key } name={ key } { ...props } />)
        }
      </Section.Body>
    </Section>
  );
}

function SettingsField(props) {

  const { type, flag } = props;

  const flagValue = useMemo(() => {
    return Flags.get(flag);
  }, [ flag ]);

  const component = useMemo(() => {
    if (type === 'text') {
      return TextInput;
    }

    if (type === 'boolean') {
      return CheckBox;
    }

    if (type === 'select') {
      return Select;
    }

    return null;
  }, [ type ]);

  if (!component) {
    return null;
  }

  const { name, label, description, options, documentationUrl } = props;

  const typeProp = type === 'boolean' ? { type: 'checkbox' } : {};

  const disabledByFlag = flagValue !== undefined;

  return <>
    <Field
      name={ name }
      component={ component }
      { ...typeProp }
      disabled={ disabledByFlag }
      label={ label }
      description={ description }
      options={ options }
      documentationUrl={ documentationUrl }
    />
    { disabledByFlag &&
      <div className="flag-warning">
        This option is overridden by <code>{ flag }</code> flag.&nbsp;
        <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/">Learn more.</a>
      </div>
    }
  </>;
}