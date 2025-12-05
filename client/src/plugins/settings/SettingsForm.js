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

import { map, forEach, sortBy, isString, isObject } from 'min-dash';

import { Section, TextInput, CheckBox, Select, Radio } from '../../shared/ui';

import Flags from '../../util/Flags';

import { utmTag } from '../../util/utmTag';

/**
 * Formik form wrapper for the settings form.
 */
export function SettingsForm({ schema, values, onChange, targetElement }) {

  const { setFieldValue, values: formikValues, validateForm } = useFormikContext();



  useEffect(() => {
    onChange(formikValues);
  }, [ formikValues, onChange ]);

  useEffect(() => {
    forEach(values, (value, key) => {
      setFieldValue(key, value);
    });
  }, [ values, setFieldValue ]);

  useEffect(() => {
    validateForm();
  }, [ formikValues, validateForm ]);

  const orderedSchema = useMemo(() => {
    if (!schema) return {};

    return sortSchemaByOrder(schema);
  }, [ schema ]);

  const sections = useMemo(() => {
    const result = [];

    forEach(orderedSchema, (value, key) => {

      // If the schema has sections, group properties by section and render each
      if (value.sections) {

        // Group properties by section
        const propertiesBySection = {};
        forEach(value.properties, (property, propKey) => {
          const sectionId = property.section || 'default';
          if (!propertiesBySection[sectionId]) {
            propertiesBySection[sectionId] = {};
          }
          propertiesBySection[sectionId][propKey] = property;
        });

        // Render each section
        forEach(value.sections, (section, sectionId) => {
          const sectionProperties = propertiesBySection[sectionId] || {};
          result.push(
            <SettingsSection
              key={ `${key}-${sectionId}` }
              title={ section.title }
              description={ section.description }
              properties={ sectionProperties }
              targetElement={ targetElement }
            />
          );
        });
      } else {

        // Otherwise render as a single section
        result.push(<SettingsSection key={ key } { ...value } targetElement={ targetElement } />);
      }
    });

    return result;
  }, [ orderedSchema ]);

  return (<Form>
    { sections }
  </Form>);
}

function SettingsSection(props) {

  const { title, description, properties } = props;

  return (
    <Section>
      <Section.Header>{ title }</Section.Header>
      <Section.Body>
        { description && <p className="section__description">{ description }</p> }
        {
          map(properties, (property, key) =>
            <SettingsField key={ key } name={ key } { ...property } targetElement={ props.targetElement } />)
        }
      </Section.Body>
    </Section>
  );
}

export function SettingsField(props) {

  const { type, flag, condition, name } = props;

  const { values } = useFormikContext();

  const flagValue = useMemo(() => {
    return Flags.get(flag);
  }, [ flag ]);

  const FieldComponent = useMemo(() => {
    if (condition && !isConditionMet(name, values, condition)) {
      return null;
    }

    if (type === 'custom') {
      return props.component;
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

  if (!FieldComponent) {
    return null;
  }

  if (type === 'custom') {
    return <FieldComponent { ...props } />;
  }

  const { label, description, hint, options, documentationUrl, constraints } = props;

  let restProps = {
    fieldError: settingsFieldError
  };
  if (type === 'boolean') {
    restProps.type = 'checkbox';
  }
  if (type === 'password') {
    restProps.type = 'password';
  }

  const disabledByFlag = flagValue !== undefined;

  let validate;
  if (constraints) {
    validate = validator(constraints, label || name);
  }

  return <>
    <Field
      name={ name }
      component={ FieldComponent }
      disabled={ disabledByFlag }
      label={ label }
      description={ description }
      hint={ hint }
      options={ options }
      values={ options }
      documentationUrl={ documentationUrl }
      validate={ validate }
      { ...restProps }
    />
    { disabledByFlag &&
      <div className="flag-warning">
        This option is overridden by <code>{ flag }</code> flag.&nbsp;
        <a href={
          utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/')
        }>Learn more.</a>
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
 * Works with both nested Formik values (when propName is provided) and flat objects.
 *
 * @param {string} [propName] - The base path for the property being evaluated. If omitted, values are treated as a flat object.
 * @param {Object} values - The object containing form values
 * @param {Condition} condition - The condition object to evaluate.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export function isConditionMet(propName, values, condition) {
  if (!condition) {
    return true;
  }

  if (condition.allMatch) {
    return condition.allMatch.every((childCondition) => isConditionMet(propName, values, childCondition));
  }

  if (!condition.property) {
    return false;
  }

  // If propName is provided, use path resolution for nested Formik values
  // Otherwise, treat values as a flat object with direct property access
  const conditionPropValue = propName
    ? getIn(values, resolvePath(propName, condition.property))
    : values[condition.property];

  if ('equals' in condition) {
    return conditionPropValue === condition.equals;
  }

  if (condition.oneOf) {
    return condition.oneOf.includes(conditionPropValue);
  }

  return false;
}

/**
 * @typedef {Object} PatternConstraint
 * @property {string} value - The regex pattern string
 * @property {string} message - Custom error message when pattern doesn't match
 */

/**
 * @typedef {Object} Constraints
 * @property {string|boolean} [notEmpty] - If true/string, field must not be empty. If string, used as custom error message
 * @property {string|PatternConstraint} [pattern] - Regex pattern the field must match. Can be string pattern or PatternConstraint object
 */

/**
 * Creates a validation function for form fields based on the provided constraints.
 *
 * @param {Constraints} constraints - The validation constraints to apply
 * @param {string} [propLabel] - The label of the property being validated (used in error messages)
 * @returns {function(value: any): string|undefined} A validation function that returns an error message or undefined if valid
 */
function validator(constraints, propLabel) {
  return function(value) {
    let {
      notEmpty,
      pattern
    } = constraints;

    if (notEmpty && isEmpty(value)) {
      return isString(notEmpty) ? notEmpty : `${propLabel || 'This field'} must not be empty`;
    }

    if (pattern !== undefined) {
      let message;
      if (isObject(pattern)) {
        ({ value: pattern, message } = pattern);
      }

      if (!matchesPattern(value, pattern)) {
        return message || `${propLabel || 'This field'} must match pattern ${pattern}`;
      }
    }
  };
}

function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

function matchesPattern(value, pattern) {
  return new RegExp(pattern).test(value);
}

function validateValue(value, constraints, label) {
  if (constraints)
    return validator(constraints, label)(value);
}

export function validateProperties(values, properties) {
  if (!values) {
    return { _error: 'No values provided' };
  }

  const errors = {};

  for (const property of properties) {
    const { key, condition, constraints, label } = property;

    // Skip validation if condition is not met (field is not visible/applicable)
    if (!isConditionMet(null, values, condition)) {
      continue;
    }

    const value = values[key];
    const error = validateValue(value, constraints, label);

    if (error) {
      errors[key] = error;
    }
  }

  return errors;
}

/**
 * shows error as soon as there is an error (without needing to be touched)
 */
function settingsFieldError(meta) {
  return meta.error;
}
