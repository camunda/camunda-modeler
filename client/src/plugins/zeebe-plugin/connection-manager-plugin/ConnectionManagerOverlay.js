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
import { CONNECTION_CHECK_ERROR_REASONS } from '../deployment-plugin/ConnectionCheckErrors';

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
        <form className="fields">
          <div className={ classNames('form-group', 'form-group-spacing') }>
            <div>
              <Select
                field={ {
                  name: 'connection',
                  onChange: (event) => handleConnectionChange(event.target.value)
                } }
                className="form-control"
                name="connection"
                label={
                  <>
                    Connection <a className="manage-connections-link" onClick={ handleManageConnections } href="#">
                      Manage connections
                    </a>
                  </>
                }
                options={ [
                  ...connections.map(connection => ({
                    value: connection.id,
                    label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
                  })),
                  { separator: true },
                  { value: 'NO_CONNECTION', label: 'Disabled (offline mode)' }
                ] }
                value={ activeConnection?.id }
                fieldError={
                  () => connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG ?
                    <>
                      Could not establish connection: <br />
                      { getMessageForReason(connectionCheckResult?.reason) }
                    </> :
                    undefined
                }
              />
            </div>
          </div>

          <div className={ classNames('form-group form-description') }>
            Use the Camunda 8 Orchestration Cluster to assist during development, i.e., to enable task testing or when using the deploy and run tools. <a href="#">
              Learn more
            </a>
          </div>
        </form>
      </Section.Body>
    </Section>
  );
}
