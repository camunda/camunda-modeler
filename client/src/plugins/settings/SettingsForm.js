/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Field, FieldArray, Form, useFormikContext, getIn } from 'formik';

import { map, forEach, sortBy, isString, isObject } from 'min-dash';

import { DataTable, Table, TableBody, TableCell, TableExpandRow, TableExpandedRow, Button } from '@carbon/react';
import { TrashCan, Add, ErrorFilled, CheckmarkFilled, CircleFilled } from '@carbon/react/icons';

import { Section, TextInput, CheckBox, Select, Radio } from '../../shared/ui';

import Flags from '../../util/Flags';
import { generateId } from '../../util';

const FIELD_ARRAY_TYPES = [ 'expandableTable' ];

/**
 * Formik form wrapper for the settings form.
 */
export function SettingsForm({ schema, values, onChange }) {

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

    setTimeout(() => validateForm(), 10);
  }, [ validateForm ]);

  useEffect(() => {
    validateForm(formikValues);
  }, [ formikValues, validateForm ]);

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

  const FieldComponent = useMemo(() => {
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

    if (type === 'expandableTable') {
      return ExpandableTableFieldArray;
    }

    return null;
  }, [ condition, name, type, values ]);


  if (!FieldComponent) {
    return null;
  }

  if (FIELD_ARRAY_TYPES.includes(type)) {
    return <FieldComponent { ...props } />;
  }

  const { label, description, hint, options, documentationUrl, constraints } = props;

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
      component={ FieldComponent }
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


function ExpandableTableFieldArray({ name, label, description, rowProperties, childProperties, formConfig }) {
  const { values, isValidating, errors, validateForm } = useFormikContext();

  const arrayValues = getIn(values, name) || [];

  const [ expandedRows, setExpandedRows ] = useState([]);

  function generateNewElement() {
    const defaults = Object.entries({ ...rowProperties, ...childProperties })
      .reduce((acc, [ key, property ]) => {
        if (property.default !== undefined) {
          acc[key] = property.default;
        }
        return acc;
      }, {});

    return { id: generateId(), ...defaults };
  }

  function isExpanded(row) {
    return expandedRows.includes(row.id);
  }

  function handleExpand(row) {
    if (isExpanded(row)) {
      setExpandedRows([]);
    }
    else {
      setExpandedRows([ row.id ]);
    }
  }

  function getMainError(name,index) {
    return getIn(errors, `${name}[${index}]._mainError`);
  }

  return <FieldArray name={ name } className="form-group">
    {(arrayHelpers) => {
      return (
        <div className="form-group">
          <div className="custom-control">
            <label className="custom-control-label">{ label }</label>
            <div className="custom-control-description">{ description }</div>
          </div>
          {(!arrayValues || arrayValues.length === 0) && (
            <p className="empty-placeholder">{ formConfig?.emptyPlaceholder }</p>
          )}
          <DataTable rows={ arrayValues } headers={ [] }>
            {({
              rows,
              getRowProps,
              getExpandedRowProps,
              getTableProps,
            }) => (
              <Table { ...getTableProps() }>
                <TableBody className="expandable-table-body">
                  {rows?.map((row, index) => (
                    <React.Fragment key={ `${name}[${index}]` }>
                      <TableExpandRow { ...getRowProps({ row }) }
                        isExpanded={ isExpanded(row) } onExpand={ ()=> handleExpand(row) }
                      >
                        {
                          map(rowProperties, (rowProperty , key) => {
                            return (
                              <TableCell key={ `${name}[${index}].${key}` }>
                                { isExpanded(row) && <SettingsField name={ `${name}[${index}].${key}` } { ...rowProperty } /> }
                                { !isExpanded(row) && <span name={ `${name}[${index}].${key}` }>{ arrayValues[index][key] }</span> }
                              </TableCell>
                            );
                          })
                        }
                        <TableCell className="action-cell">
                          <Button
                            className="remove"
                            hasIconOnly
                            iconDescription={ formConfig?.removeTooltip || 'Remove' }
                            tooltipPosition="left"
                            kind="ghost"
                            renderIcon={ TrashCan }
                            onClick={ () =>
                              arrayHelpers.remove(index)
                            }
                          />
                        </TableCell>
                      </TableExpandRow>

                      <TableExpandedRow
                        { ...getExpandedRowProps({ row }) }
                        colSpan={ Object.keys(rowProperties).length + 2 } // +1 for expand column, +1 for action column
                      >
                        <div>
                          <div>
                            <p>
                              { (!isValidating && getMainError(name,index)) && <> <ErrorFilled fill="var(--color-status-bar-error)" /> {getMainError(name,index)} <a href="" onClick={ () => validateForm() } title={ 'Error. DEBUG:' + JSON.stringify(errors) }>retry</a>  </> }
                              { (!isValidating && !getMainError(name,index)) && <><CheckmarkFilled fill="var(--color-status-bar-success)" title="Connected" /> Connected </>}
                              { (isValidating) && <><CircleFilled fill="var(--color-status-bar-loading)" title="Checking" /> Checking </> }
                            </p>
                          </div>
                          {
                            map(childProperties, (childProperty , key) => {
                              return (
                                <SettingsField key={ `${name}[${index}].${key}` } name={ `${name}[${index}].${key}` } { ...childProperty } />
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
          <div style={ { marginTop:'12px', float:'right' } }>
            <Button
              tooltipPosition="left"
              iconDescription={ formConfig?.addLabel || 'Add' }
              renderIcon={ Add }
              hasIconOnly={ true }
              onClick={ () => {
                const newElement = generateNewElement();
                arrayHelpers.push(newElement);
                setExpandedRows([ newElement.id ]);
              } }
            />
          </div>
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
  if (!condition) {
    return true;
  }

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
