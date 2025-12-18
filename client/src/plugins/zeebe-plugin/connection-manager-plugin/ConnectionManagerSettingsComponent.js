/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useRef, useState } from 'react';

import { Button, DataTable, Table, TableBody, TableCell, TableExpandedRow, TableExpandRow } from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

import { getIn } from 'formik';

import { SettingsField } from '../../settings/SettingsForm';
import { generateNewElement, properties } from './ConnectionManagerSettingsProperties';

import * as css from './ConnectionManagerSettingsComponent.less';

/**
 *
 * @param {import("formik").FieldArrayRenderProps & { expandRowId: string }} props
 */
export function ConnectionManagerSettingsComponent({ form, name:fieldName, push, remove, expandRowId }) {

  const [ expandedRows, setExpandedRows ] = useState([]);
  const expandedRowRef = useRef(null);

  const fieldValue = getIn(form.values, fieldName) || [];

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

  return <div className={ css.ConnectionManagerSettings } data-testid="connection-manager-settings">
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
                    {/* TODO: connection status */}
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
  </div>;
}
