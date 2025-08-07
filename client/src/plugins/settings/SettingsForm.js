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

import { Field, FieldArray, Form, useFormikContext, getIn } from 'formik';

import { map, forEach, sortBy, get, isString, isObject } from 'min-dash';

import { Section, TextInput, CheckBox, Select, Radio } from '../../shared/ui';

import Flags from '../../util/Flags';
import { Settings } from '@carbon/icons-react';
import { Edit, TrashCan } from '@carbon/icons-react';


import {
  Accordion,
  CodeSnippet,
  AccordionItem,
  DataTable,
  ModalWrapper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tab,
  Button as CarbonButton

} from '@carbon/react';


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

  const {
    type,
    flag,
    condition,
    name,
    constraints,
    label,
    description,
    hint,
    options,
    documentationUrl
  } = props;

  const { values } = useFormikContext();

  if (condition) {
    const met = isConditionMet(name, values, condition);
    if (!met) {
      return null;
    }
  }

  if (type === 'array') {
    return <SettingsFieldArray { ...props } />;
  }

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

    if (type === 'password') {
      return function PasswordInput(props) {
        return <TextInput { ...props } type="password" />;
      };
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


  let typeProp = {};
  if (type === 'boolean') {
    typeProp = { type: 'checkbox' };
  }
  if (type === 'password') {
    typeProp = { type: 'password' };
  }

  const disabledByFlag = flagValue !== undefined;

  let validate;
  if (constraints) {
    validate = validator(constraints, label || name);
  }

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
      validate={ validate }
    />
    { disabledByFlag &&
      <div className="flag-warning">
        This option is overridden by <code>{ flag }</code> flag.&nbsp;
        <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/">Learn more.</a>
      </div>
    }
  </>;
}

function SettingsFieldArray(props) {

  const { name, label, description, childProperties, formConfig, validator } = props;
  const { setFieldError } = useFormikContext();
  const arrayValues = getIn(useFormikContext().values, name) || [];

  // Generic validation function for individual array items
  const validateArrayItem = React.useCallback(async (item, index) => {
    if (!item || typeof item !== 'object') return;

    // Clear previous errors for this item
    const fieldKeys = Object.keys(childProperties || {});
    fieldKeys.forEach(key => {
      setFieldError(`${name}[${index}].${key}`, undefined);
    });

    // Basic cross-field validation within the item
    if ((item.name && !item.url) || (!item.name && item.url)) {
      setFieldError(`${name}[${index}].name`, 'Both name and URL must be provided together');
      setFieldError(`${name}[${index}].url`, 'Both name and URL must be provided together');
      return;
    }

    // Skip custom validation if validator function is not provided
    if (!validator || typeof validator !== 'function') {
      return;
    }

    // Check if we have enough data to run validation
    if (!item.name) {
      return; // Don't validate incomplete items
    }

    try {

      // Run the custom validator function
      const validationResult = await validator(item);

      if (validationResult === false) {
        setFieldError(`${name}[${index}].url`, 'Validation failed - please verify your settings');
      } else if (typeof validationResult === 'string') {

        // If validator returns a string, use it as the error message
        setFieldError(`${name}[${index}].url`, validationResult);
      } else if (typeof validationResult === 'object' && validationResult !== null) {

        // If validator returns an object, set field-specific errors
        Object.keys(validationResult).forEach(fieldKey => {
          if (validationResult[fieldKey]) {
            setFieldError(`${name}[${index}].${fieldKey}`, validationResult[fieldKey]);
          }
        });
      } else {

        // Validation successful, clear any previous errors
        setFieldError(`${name}[${index}].url`, undefined);
      }
    } catch (error) {
      setFieldError(`${name}[${index}].url`, `Validation error: ${error.message}`);
    }
  }, [ name, setFieldError, childProperties, validator ]);

  // Track which item is currently being edited
  const [ editingIndex, setEditingIndex ] = React.useState(null);

  // Validate item when specific fields change for the edited item
  // React.useEffect(() => {
  //   if (editingIndex !== null && arrayValues[editingIndex]) {
  //     const debounceTimer = setTimeout(() => {
  //       validateArrayItem(arrayValues[editingIndex], editingIndex);
  //     }, 1000); // Debounce validation by 1 second

  //     return () => clearTimeout(debounceTimer);
  //   }
  // }, [ arrayValues, editingIndex, validateArrayItem ]);

  return <FieldArray name={ name }>
    {(arrayHelpers) => {
      return (
        <div>
          <h3>{ label }</h3>
          { description && <p>{ description }</p> }

          <p style={ {
            fontSize: '13px',
          } }>
            Set up and manage connections to your process automation environments. If you want to work locally have a look at <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/">c8run</a>
          </p>

          {arrayValues.length === 0 && (
            <p style={ {
              fontSize: '13px',
            } }>
              {
                formConfig.placeholder
              }
            </p>
          )}

          <DataTable rows={ arrayValues } headers={ [] }>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getExpandedRowProps,
              getTableProps,
              getTableContainerProps,
              expandRow,
            }) => (

              <Table { ...getTableProps() }>

                {/* <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    <TableHeader>{Object.values(childProperties)[0]?.label}</TableHeader>
                    <TableHeader> */}
                {/* <Tag style={ { float: 'right', padding: '10px' } } type="blue" onClick={ () => arrayHelpers.push({ id: `${values.length + 1}` }) }>
                        + Add
                      </Tag> */}
                {/* </TableHeader>
                  </TableRow>
                </TableHead> */}
                <TableBody style={
                  {
                    backgroundColor: 'white',

                  }
                }>
                  {rows?.map((row, index) => (
                    <React.Fragment key={ `${props.name}[${index}]` }>

                      <TableExpandRow { ...getRowProps({ row }) }>

                        <TableCell>
                          {arrayValues[index]?.name || 'Unnamed'}
                        </TableCell>
                        <TableCell style={ { width: '50px' } }>
                          {/* <Button type="button" onClick={ () => arrayHelpers.remove(index) }>Remove</Button> */}

                          <CarbonButton

                            hasIconOnly
                            iconDescription="Remove"
                            tooltipPosition="left"
                            kind="ghost"
                            onClick={ () =>
                              arrayHelpers.remove(index)
                            }
                            renderIcon={ TrashCan }
                          />

                        </TableCell>

                      </TableExpandRow>
                      <TableExpandedRow
                        { ...getExpandedRowProps({ row }) }
                        colSpan={ 3 }
                        onFocus={ () => setEditingIndex(index) }
                        onBlur={ () => setEditingIndex(null) }
                      >
                        <div
                          onClick={ () => setEditingIndex(index) }
                          onFocus={ () => setEditingIndex(index) }
                        >
                          {
                            map(childProperties, (childProps , key) =>
                            {
                              return (
                                <SettingsField key={ `${name}[${index}].${key}` } name={ `${name}[${index}].${key}` } { ...childProps } />
                              );
                            })
                          }
                        </div>
                      </TableExpandedRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
          <button
            style={ {
              marginTop:'6px'
            } }
            className="btn btn-primary"
            type="submit"
            onClick={ () => arrayHelpers.push(formConfig.elementGenerator()) }
          >
            {formConfig.addLabel || 'Add'}
          </button>
        </div>
      );
    }}
  </FieldArray>;
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

function SettingsFieldArrayBackupt(props) {


  const { name, label, description, children, documentationUrl } = props;
  const values = getIn(useFormikContext().values, name);


  return <FieldArray name={ name }>
    {(arrayHelpers) => {
      return (
        <div>
          {values?.map((item, index) => (
            <div key={ index }>
              <Field
                name={ `${name}.${index}` }
                component={ TextInput }
                label={ label }
                description={ description }
                documentationUrl={ documentationUrl }
              >

              </Field>
              <Button type="button" onClick={ () => arrayHelpers.remove(index) }>Remove</Button>

            </div>
          ))}
          <Button onClick={ () => arrayHelpers.push('') }>Add Item</Button>
        </div>
      );
    }}
  </FieldArray>;
}

/**
 * Resolves a path relative to the current path or itself
 *
 * @param {string} currentPath
 * @param {string} targetPath - Path to resolve. If it contains a dot, it is considered an absolut path and returned as is.
 * @returns {string} The resolved path
 */
function resolvePath(currentPath, targetPath) {
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
function isConditionMet(propName, values, condition) {
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

    if (pattern) {
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
  return value.match(pattern);
}
