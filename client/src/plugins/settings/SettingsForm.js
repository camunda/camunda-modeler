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

import { Field, Form, useFormikContext, getIn } from 'formik';

import { map, forEach, sortBy } from 'min-dash';

import { Section, TextInput, CheckBox, Select, Radio } from '../../shared/ui';

import Flags from '../../util/Flags';

/**
 * Formik form wrapper for the settings form.
 */
export function SettingsForm(props) {

  const { schema, values } = props;

  const { setFieldValue, dirty, values: formikValues, submitForm } = useFormikContext();

  useEffect(() => {
    dirty && submitForm();
  }, [ dirty, formikValues, submitForm ]);

  useEffect(() => {
    forEach(values, (value, key) => {
      setFieldValue(key, value);
    });
  }, [ values, setFieldValue ]);

  const orderedSchema = useMemo(() => {
    if (!schema) return {};

    return sortSchemaByOrder(schema);
  }, [ schema ]);

  return (<Form>
    {
      map(orderedSchema, (value, key) =>
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

  const { type, flag, condition, name } = props;

  const { values } = useFormikContext();

  const flagValue = useMemo(() => {
    return Flags.get(flag);
  }, [ flag ]);

  const component = useMemo(() => {
    if (condition && !isConditionMet(name, values, condition)) {
      return null;
    }

    if (type === 'text' || type === 'password') {
      return TextInput;
    }

    if (type === 'boolean') {
      return CheckBox;
    }

    if (type === 'select') {
      return Select;
    }

    if (type === 'radio') {
      return Radio;
    }

    return null;
  }, [ condition, name, type, values ]);

  if (!component) {
    return null;
  }

  const { label, description, hint, options, documentationUrl } = props;

  let typeProp = {};
  if (type === 'boolean') {
    typeProp = { type: 'checkbox' };
  }
  if (type === 'password') {
    typeProp = { type: 'password' };
  }

  const disabledByFlag = flagValue !== undefined;

  return <>
    <Field
      name={ name }
      component={ component }
      { ...typeProp }
      disabled={ disabledByFlag }
      label={ label }
      description={ description }
      hint={ hint }
      options={ options }
      values={ options }
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


// helpers

/**
 * Returns a schema sorted by `order` property.
 *
 * @param {Object} schema
 * @returns {Object} sorted schema
 */
function sortSchemaByOrder(schema) {

  const sortedArray = sortBy(schema, ({ order }) => {
    return order ?? 9999;
  });

  const sortedObj = sortedArray.reduce((acc, obj) => {
    acc[obj.id] = { ...obj };
    return acc;
  }, {});

  return sortedObj;
}

/**
 * Resolves a path relative to the current path or itself if its an absolute path (contains a dot).
 *
 * @param {string} currentPath
 * @param {string} targetPath - Path to resolve. If it contains a dot, it is considered an absolute path and returned as is.
 * @returns {string} The resolved path
 */
export function resolvePath(currentPath, targetPath) {
  if (targetPath.includes('.')) {
    return targetPath;
  }

  const currentSegments = currentPath.split('.');

  currentSegments.pop();

  const resolvedSegments = [ ...currentSegments, targetPath ];
  return resolvedSegments.join('.');
}

/**
 * @typedef {Object} Condition A condition to be met for a form field to be shown
 * @property {string} [property] - The key of the property to check, can be relative.
 * @property {Array<Condition>} [allMatch] - A list of child conditions that must all be met.
 * @property {any} [equals] - The value the property should be equal to.
 * @property {Array<any>} [oneOf] - A list of possible values for the property.
 *
 * @example
 * { property: 'some.key', equals: true }
 * { property: 'some.key', oneOf: [ 'a', 'b', 'c' ] }
 * { allMatch: [ { property: 'some.key', equals: true }, { property: 'other.key', oneOf: [ 'a', 'b' ] } ] }
 */

/**
 * Checks if a given condition is met based on the provided form values.
 *
 * @param {string} propName - The base path for the property being evaluated.
 * @param {Object} values - The object containing all form values, used to cross reference other section/fields
 * @param {Condition} condition - The condition object to evaluate.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export function isConditionMet(propName, values, condition) {
  if (condition.allMatch) {
    return condition.allMatch.every((childCondition) => isConditionMet(propName, values, childCondition));
  }

  if (!condition.property) {
    return false;
  }
  const conditionPropPath = resolvePath(propName, condition.property);
  const conditionPropValue = getIn(values, conditionPropPath);

  if ('equals' in condition) {
    return conditionPropValue === condition.equals;
  }

  if (condition.oneOf) {
    return condition.oneOf.includes(conditionPropValue);
  }

  return false;
}
