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

import { map, forEach, sortBy, get } from 'min-dash';

import { Section, TextInput, CheckBox, Select, Radio, Button } from '../../shared/ui';

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
  }, [ formikValues ]);

  useEffect(() => {
    forEach(values, (value, key) => {
      setFieldValue(key, value);
    });
  }, [ values ]);

  const orderedSchema = useMemo(() => {
    if (!schema) return {};

    return sortSchemaByOrder(schema);
  }, [ schema, values ]);

  return (<Form>
    {
      map(orderedSchema, (value, key) =>
        <SettingsSection key={ key } { ...value } />)
    }
  </Form>);
}

function SettingsSection(props) {
  console.log('rendering');
  const { title, properties } = props;


  return (
    <Section>

      <Section.Header>{ title }</Section.Header>
      <Section.Body>
        {
          map(properties, (props, key) =>{
            return (<SettingsField key={ key } name={ key } { ...props } />);
          }
          )
        }

      </Section.Body>
    </Section>
  );
}

function SettingsField(props) {

  const { type, flag, condition } = props;


  const { values } = useFormikContext();

  if (condition) {
    const met = isConditionMet(props.name, values, condition);
    console.log('met', met, condition, props.name, values);
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
    if (type === 'text') {
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

function SettingsFieldArray(props) {
  console.log('rendering SettingsFieldArray');


  const { name, label, description, childProperties, documentationUrl } = props;
  const values = getIn(useFormikContext().values, name);
  if (!values) {
    return null;
  }


  return <FieldArray name={ name }>
    {(arrayHelpers) => {
      return (
        <div>
          <p style={ {
            fontSize: '13px',
          } }>
            Set up and manage connections to your process automation environments.
          </p>




          <DataTable style={ { } } rows={ values } headers={ [] }>
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

                <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    <TableHeader>{Object.values(childProperties)[0]?.label}</TableHeader>
                    <TableHeader>
                      {/* <Tag style={ { float: 'right', padding: '10px' } } type="blue" onClick={ () => arrayHelpers.push({ id: `${values.length + 1}` }) }>
                        + Add
                      </Tag> */}
                    </TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody style={
                  {
                    backgroundColor: 'white',

                  }
                }>
                  {rows?.map((row, index) => (
                    <React.Fragment key={ `${props.name}[${index}]` }>

                      <TableExpandRow { ...getRowProps({ row }) }>

                        <TableCell>
                          {values[index]?.name || 'Unnamed'}
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
                      <TableExpandedRow { ...getExpandedRowProps({ row }) } colSpan={ 3 }>
                        {

                          map(childProperties, (childProps , key) =>
                          {
                            console.log('rendering map child');
                            return (


                              <SettingsField key={ `${name}[${index}].${key}` } name={ `${name}[${index}].${key}` } { ...childProps } />


                            );
                          })
                        }
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
            onClick={ () => arrayHelpers.push({ id: `${values.length + 1}` }) }
          >
            Add connection
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
  console.log(props);


  const { name, label, description, children, documentationUrl } = props;
  const values = getIn(useFormikContext().values, name);

  // console.log('hytusnruystny', formikValues);
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
  console.log(targetPath);
  if (targetPath.includes('.')) {
    return targetPath;
  }

  const currentSegments = currentPath.split('.');

  currentSegments.pop();

  const resolvedSegments = [ ...currentSegments, targetPath ];
  return resolvedSegments.join('.');
}



function isConditionMet(propName, values,condition) {

  if (condition.allMatch) {
    return condition.allMatch.every((childCondition) => isConditionMet(propName, values, childCondition));
  }

  const conditionPropPath = resolvePath(propName, condition.property);
  const conditionPropValue = getIn(values, conditionPropPath);

  if (condition.equals && conditionPropValue !== condition.equals) {
    return false;
  }

  if (condition.oneOf && !condition.oneOf.includes(conditionPropValue)) {
    return false;
  }


  return true;
}