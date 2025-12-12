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
import { utmTag } from '../../../util/utmTag';

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

  const connectionLabel = (
    <>
      <span>Connection</span>
      <a className="manage-connections-link" onClick={ handleManageConnections } href="#">
        Manage connections
      </a>
    </>
  );

  const connectionOptions = [
    ...connections.map(connection => ({
      value: connection.id,
      label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
    })),
    { separator: true },
    { value: 'NO_CONNECTION', label: 'Disabled (offline mode)' }
  ];

  const getConnectionFieldError = () => {
    if (connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG) {
      return (
        <>
          Could not establish connection: <br />
          { getMessageForReason(connectionCheckResult?.reason) }
        </>
      );
    }
    return undefined;
  };

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
                label={ connectionLabel }
                options={ connectionOptions }
                value={ activeConnection?.id }
                fieldError={ getConnectionFieldError }
              />
            </div>
          </div>

          <div className={ classNames('form-group form-description') }>
            A connection to a running orchestration cluster lets you test tasks, deploy resources, and run processes. <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/connect-to-camunda-8/') }>
              Learn more
            </a>
          </div>
        </form>
      </Section.Body>
    </Section>
  );
}
