/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, DataTable, Table, TableBody, TableCell, TableExpandedRow, TableExpandRow } from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

import { FieldArray, getIn, useFormikContext } from 'formik';

import { SettingsField } from '../../settings/SettingsForm';
import { generateNewElement, properties } from './ConnectionManagerSettingsProperties';

import * as css from './ConnectionManagerSettingsComponent.less';

import { CONNECTION_CHECK_ERROR_REASONS, getConnectionCheckFieldErrors } from '../deployment-plugin/ConnectionCheckErrors';
import { StatusIndicator } from '../shared/StatusIndicator';


/**
 * Connection Manager Settings Component
 *
 * @param {Object} props
 * @param {string} props.name - Field name for the connection array
 * @param {string} props.targetElement - Element ID to scroll to and expand
 * @param {Object} props.connectionChecker - Connection checker instance ref
 */
export function ConnectionManagerSettingsComponent({ name: fieldName, targetElement, connectionChecker }) {

  const { values, validateForm } = useFormikContext();

  const [ expandedRows, setExpandedRows ] = useState([]);
  const expandedRowRef = useRef(null);
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  const fieldValue = getIn(values, fieldName) || [];

  const connectionIndex = useMemo(() =>
    fieldValue.findIndex(c => c.id === expandedRows[0]),
  [ fieldValue, expandedRows ]
  );

  const connection = useMemo(() =>
    connectionIndex >= 0 ? fieldValue[connectionIndex] : null,
  [ fieldValue, connectionIndex ]
  );


  let expandRowId = null;

  if (targetElement) {
    const match = targetElement.match(/\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1], 10);
      if (fieldValue[index]) {
        expandRowId = fieldValue[index].id;
      }
    }
  }

  // Automatically expand the row if expandRowId is set
  useEffect(() => {
    if (expandRowId) {
      setExpandedRows([ expandRowId ]);
    }
  }, [ expandRowId ]);

  useEffect(() => {
    const updateConnectionChecker = async () => {
      if (expandedRows?.length > 0) {
        setConnectionCheckResult(null);
        const formErrors = await validateForm();
        const expandedConnectionErrors = getIn(formErrors, `${fieldName}[${connectionIndex}]`);
        if (expandedConnectionErrors) {
          connectionChecker.current.stopChecking();
          setConnectionCheckResult({ success: false, reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CONFIGURATION });
          return;
        }

        connectionChecker.current.updateConfig({ endpoint: connection });
      }
      else {
        connectionChecker.current.stopChecking();
        setConnectionCheckResult(null);
      }
    };
    updateConnectionChecker();
  }, [ expandedRows, connectionChecker, connection, connectionIndex ]);

  useEffect(() => {
    const connectionCheckListener = (connectionCheckResult) => {
      setConnectionCheckResult(connectionCheckResult);
    };

    connectionChecker.current.on('connectionCheck', connectionCheckListener);

    return () => {
      connectionChecker.current.off('connectionCheck', connectionCheckListener);
      connectionChecker.current.stopChecking();
    };
  }, [ connectionChecker ]);



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

  function getStatus(connectionCheckResult) {

    if (connectionCheckResult) {
      return connectionCheckResult.success ? 'success' : 'error';
    }

    return 'loading';
  }

  const errorMessages = getConnectionCheckFieldErrors(connectionCheckResult);

  function getText(connectionCheckResult) {
    if (connectionCheckResult) {
      return connectionCheckResult.success ? 'Connected' : errorMessages?._mainError || 'Failed to connect';
    }
    return 'Connecting...';
  }




  return <FieldArray name={ fieldName }>
    { ({ push, remove }) => {
      return (
        <div className={ css.ConnectionManagerSettings } data-testid="connection-manager-settings">
          <div className="custom-control">
            <div className="custom-control-description">Manage Camunda 8 orchestration cluster connections.</div>
          </div>
          {(!fieldValue || fieldValue.length === 0) && (
            <p className="empty-placeholder">No connections configured</p>
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
                        ref={ row.id === expandRowId ? expandedRowRef : null }
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
                            onClick={ () =>
                              remove(index)
                            }
                          />
                        </TableCell>
                      </TableExpandRow>

                      <TableExpandedRow
                        { ...getExpandedRowProps({ row }) }
                        colSpan={ 3 } // +1 for expand column, +1 for name, +1 for action column
                      >
                        <div>
                          <StatusIndicator
                            status={ getStatus(connectionCheckResult) }
                            text={ getText(connectionCheckResult) }
                          />

                          {
                            properties.map((property) =>
                              <SettingsField key={ `${fieldName}[${index}].${property.key}` } name={ `${fieldName}[${index}].${property.key}` } { ...property } />
                            )
                          }
                        </div>
                      </TableExpandedRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
          <div className="action-bar">
            <Button
              className="add"
              tooltipPosition="left"
              iconDescription="Add connection"
              renderIcon={ Add }
              hasIconOnly={ true }
              onClick={ () => {
                const newElement = generateNewElement(fieldValue.length);
                push(newElement);
                setExpandedRows([ newElement.id ]);
              } }
            />
          </div>
        </div>
      );
    }}
  </FieldArray>;

}
