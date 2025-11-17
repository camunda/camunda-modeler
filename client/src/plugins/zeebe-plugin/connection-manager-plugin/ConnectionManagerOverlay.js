/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import classNames from 'classnames';

import { Section, Select } from '../../../shared/ui';
import { getMessageForReason } from '../../zeebe-plugin/shared/util';

export function ConnectionManagerOverlay({
  connections = [],
  handleConnectionChange,
  connectionCheckResult,
  activeConnection,
  handleManageConnections,
  renderHeader
}) {
  function getUrl(connection) {
    if (connection.targetType === 'selfHosted') {
      return connection.contactPoint;
    }
    if (connection.targetType === 'camundaCloud') {
      return connection.camundaCloudClusterUrl;
    }
  }

  return (
    <Section>
      <Section.Header className="form-header">
        {renderHeader}
      </Section.Header>
      <Section.Body className="form-body">
        {connections?.length ?
          <div className={ classNames('form-group', 'form-group-spacing') }>
            <p>Select orchestration cluster connection.</p>
            <div>
              <Select
                field={ {
                  name: 'connection',
                  onChange: (event) => handleConnectionChange(event.target.value)
                } }
                className="form-control"
                name="connection"
                placeholder="Please select a connection"
                options={ connections.map(connection => ({
                  value: connection.id,
                  label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
                })) }
                value={ activeConnection?.id }
                fieldError={ () => connectionCheckResult?.success === false ? getMessageForReason(connectionCheckResult?.reason) : undefined }
              />

            </div>
            <div className="manage-connections-container">
              <a className="manage-connections-link" onClick={ handleManageConnections }>
                Manage connections
              </a>
            </div>

          </div>
          :
          <div>
            <p className="empty-placeholder">No connections configured</p>
            <div className="manage-connections-container">
              <a className="manage-connections-link" onClick={ handleManageConnections }>
                Add connections
              </a>
            </div>
          </div>
        }
      </Section.Body>
    </Section>
  );
}