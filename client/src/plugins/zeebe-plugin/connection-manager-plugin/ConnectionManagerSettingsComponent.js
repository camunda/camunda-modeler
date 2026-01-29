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
import { ErrorFilled, TrashCan } from '@carbon/icons-react';

import { FieldArray, getIn, useFormikContext } from 'formik';

import { SettingsField, validateProperties } from '../../settings/SettingsForm';
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

  const [ expandedRows, setExpandedRows ] = useState([]);
  const [ newlyCreatedRowId, setNewlyCreatedRowId ] = useState(null);
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);

  const expandedRowRef = useRef(null);

  const { values, validateForm } = useFormikContext();
  const fieldValue = getIn(values, fieldName) || [];

  // Get backend for opening URLs
  const getGlobal = window.getGlobal || (() => ({}));
  const backend = getGlobal('backend');

  const connectionIndex = useMemo(() =>
    fieldValue.findIndex(c => c.id === expandedRows[0]),
  [ fieldValue, expandedRows ]
  );

  const connection = useMemo(() =>
    connectionIndex >= 0 ? fieldValue[connectionIndex] : null,
  [ fieldValue, connectionIndex ]
  );

  const targetRowId = useMemo(() => {
    if (!targetElement) return null;
    const match = targetElement.match(/\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1], 10);
      return fieldValue[index]?.id ?? null;
    }
    return null;
  }, [ targetElement, fieldValue ]);

  // Automatically expand the row if targetElement is set
  useEffect(() => {
    if (targetRowId) {
      setExpandedRows([ targetRowId ]);
    }
  }, [ targetRowId ]);

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

  useEffect(() => {
    const updateConnectionChecker = () => {
      if (expandedRows?.length > 0) {
        setConnectionCheckResult(null);
        validateForm();
        const validationErrors = validateProperties(connection, properties);
        if (Object.keys(validationErrors).length > 0) {
          connectionChecker.current.stopChecking();
          setConnectionCheckResult({ success: false, reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CONFIGURATION });
          return;
        }

        // Skip connection check for OAuth connections (they need browser flow first)
        if (connection?.targetType === 'selfHosted' && connection?.authType === 'oauth') {
          connectionChecker.current.stopChecking();
          setConnectionCheckResult({ success: true, reason: 'OAuth connection - use "Login with OAuth" button' });
          return;
        }

        // Skip connection check for OIDC connections (they need browser flow first)
        if (connection?.targetType === 'selfHosted' && connection?.authType === 'oidc') {
          connectionChecker.current.stopChecking();
          setConnectionCheckResult({ success: true, reason: 'OIDC connection - use "Login with OIDC" button' });
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
  }, [ expandedRows, connectionChecker, connection, connectionIndex, validateForm, properties ]);

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
                      ref={ row.id === targetRowId ? expandedRowRef : null }
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
                          <StatusIndicator
                            status={ getStatus(connectionCheckResult) }
                            text={ getText(connectionCheckResult) }
                          />
                          {
                            properties.map((property) =>
                              <SettingsField key={ `${fieldName}[${index}].${property.key}` } name={ `${fieldName}[${index}].${property.key}` } { ...property } />
                            )
                          }
                          {/* Show OAuth login button for OAuth connections */}
                          {fieldValue[index]?.targetType === 'selfHosted' && fieldValue[index]?.authType === 'oauth' && fieldValue[index]?.oauthURL && (
                            <div className="oauth-action-bar" style={{ marginTop: '20px', marginBottom: '10px' }}>
                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={() => {
                                  if (backend && backend.send) {
                                    backend.send('external:open-url', { url: fieldValue[index].oauthURL });
                                  }
                                }}
                              >
                                Login with OAuth
                              </button>
                              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                Opens OAuth provider in browser. After authentication, the connection will be saved automatically.
                              </p>
                            </div>
                          )}
                          {/* Show OIDC login button for OIDC connections */}
                          {fieldValue[index]?.targetType === 'selfHosted' && fieldValue[index]?.authType === 'oidc' && fieldValue[index]?.oidcURL && (
                            <div className="oidc-action-bar" style={{ marginTop: '20px', marginBottom: '10px' }}>
                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={() => {
                                  if (backend && backend.send) {
                                    backend.send('external:open-url', { url: fieldValue[index].oidcURL });
                                  }
                                }}
                              >
                                Login with OIDC
                              </button>
                              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                Opens OIDC provider in browser. After authentication, the connection will be saved automatically.
                              </p>
                            </div>
                          )}
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
