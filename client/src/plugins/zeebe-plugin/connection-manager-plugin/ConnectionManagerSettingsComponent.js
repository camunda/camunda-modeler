/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import { Button, DataTable, Table, TableBody, TableCell, TableExpandedRow, TableExpandRow } from '@carbon/react';
import { ErrorFilled, TrashCan } from '@carbon/icons-react';

import { FieldArray, getIn, useFormikContext } from 'formik';

import { SettingsField } from '../../settings/SettingsForm';
import { generateNewElement, properties } from './ConnectionManagerSettingsProperties';

import * as css from './ConnectionManagerSettingsComponent.less';

/**
 *
 * @param {import("formik").FieldArrayRenderProps & { expandRowId: string }} props
 */
export function ConnectionManagerSettingsComponent({ form, name:fieldName, push, remove }) {

  const [ expandedRows, setExpandedRows ] = useState([]);
  const [ newlyCreatedRowId, setNewlyCreatedRowId ] = useState(null);

  const { values } = useFormikContext();
  const fieldValue = getIn(values, fieldName) || [];

  useEffect(() => {
    if (newlyCreatedRowId && expandedRows.includes(newlyCreatedRowId)) {
      requestAnimationFrame(() => {
        const index = fieldValue.findIndex(item => item.id === newlyCreatedRowId);
        if (index !== -1) {
          const inputElement = document.getElementById(`${fieldName}[${index}].name`);
          if (inputElement) {
            inputElement.focus();
            inputElement.select();
          }
        }
        setNewlyCreatedRowId(null);
      });
    }
  }, [ expandedRows, newlyCreatedRowId, fieldName, fieldValue ]);

  /**
   * @param {{ id: any; }} row
   */
  function isExpanded(row) {
    return expandedRows.includes(row.id);
  }

  /**
   * @param {{ id: any; }} row
   */
  function handleExpand(row) {
    if (isExpanded(row)) {
      setExpandedRows([]);
    }
    else {
      setExpandedRows([ row.id ]);
    }
  }

  return <FieldArray name={ fieldName }>
    { ({ push, remove }) => {

      function handleAddConnection() {
        const newElement = generateNewElement(fieldValue.length);
        push(newElement);
        setExpandedRows([ newElement.id ]);
        setNewlyCreatedRowId(newElement.id);
      }

      return <div className={ css.ConnectionManagerSettings } data-testid="connection-manager-settings" id={ fieldName }>
        <div className="custom-control">
          <div className="custom-control-description">Deploy and run your processes on Camunda 8 Orchestration Clusters, including <a href="https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/c8run/">Camunda 8 Run</a>.</div>
        </div>
        {(!fieldValue || fieldValue.length === 0) && (
          <div className="empty-placeholder">
            <ErrorFilled size={ 20 } />
            <div className="placeholder-content">
              <h1>No connections configured</h1>
              <p>Add a cluster connection to deploy and run processes</p>
            </div>
          </div>
        )}
        <DataTable rows={ fieldValue } headers={ [] }>
          {({
            rows,
            getRowProps,
            getExpandedRowProps,
            getTableProps,
          }) => (
            <Table { ...getTableProps() }>
              <TableBody className="expandable-table-body">
                {rows?.map((row, index) => (
                  <React.Fragment key={ `${fieldName}[${index}]` }>
                    <TableExpandRow { ...getRowProps({ row }) }
                      isExpanded={ isExpanded(row) }
                      onExpand={ () => handleExpand(row) }
                    >
                      <TableCell key={ `${fieldName}[${index}].name` }>
                        { isExpanded(row) ?
                          <SettingsField name={ `${fieldName}[${index}].name` } type="text" hint="Name" default="New connection" /> :
                          <span id={ `${fieldName}[${index}].name` }>{ fieldValue[index]['name'] || 'Unnamed connection'}</span>
                        }
                      </TableCell>

                      <TableCell className="action-cell">
                        <Button
                          className="remove"
                          hasIconOnly
                          iconDescription="Remove connection"
                          tooltipPosition="left"
                          kind="ghost"
                          renderIcon={ TrashCan }
                          onClick={ () => remove(index) }
                        />
                      </TableCell>
                    </TableExpandRow>

                    {isExpanded(row) && (
                      <TableExpandedRow
                        { ...getExpandedRowProps({ row }) }
                        colSpan={ 3 } // +1 for expand column, +1 for name, +1 for action column
                      >
                        <div>
                          {/* TODO: connection status */}
                          {
                            properties.map((property) =>
                              <SettingsField key={ `${fieldName}[${index}].${property.key}` } name={ `${fieldName}[${index}].${property.key}` } { ...property } />
                            )
                          }
                        </div>
                      </TableExpandedRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </DataTable>
        <div className="action-bar">
          <button type="button" className="btn btn-primary" onClick={ handleAddConnection }>
            Add connection
          </button>
        </div>
      </div>;
    } }
  </FieldArray>;
}
