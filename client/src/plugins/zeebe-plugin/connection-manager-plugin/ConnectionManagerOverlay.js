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

import {
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@camunda/design-system';

import { getMessageForReason, isC8RunConnection } from '../../zeebe-plugin/shared/util';
import { CONNECTION_CHECK_ERROR_REASONS } from '../deployment-plugin/ConnectionCheckErrors';
import { utmTag } from '../../../util/utmTag';
import { NO_CONNECTION } from './ConnectionManagerPlugin';
import { C8RUN_DOWNLOAD_URL, C8RUN_TROUBLESHOOTING_URL } from './constants';

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

  const connectionItems = connections.map(connection => ({
    value: connection.id,
    label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
  }));

  const getConnectionFieldError = () => {
    if (connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG) {
      const { reason } = connectionCheckResult;
      const shouldOmitPrefix = [
        CONNECTION_CHECK_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE,
        CONNECTION_CHECK_ERROR_REASONS.CLUSTER_UNAVAILABLE,
        CONNECTION_CHECK_ERROR_REASONS.UNKNOWN
      ].includes(reason);

      if (shouldOmitPrefix) {
        return getMessageForReason(reason);
      }

      return (
        <>
          Could not establish connection: <br />
          { getMessageForReason(reason) }
        </>
      );
    }
    return undefined;
  };

  const getConnectionDescription = () => {
    const hasConnectionError = connectionCheckResult?.success === false && connectionCheckResult.reason !== CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG;

    if (isC8RunConnection(activeConnection) && hasConnectionError) {
      return (
        <>
          <a data-testid="c8run-download-link" href={ C8RUN_DOWNLOAD_URL }>Download</a> or start Camunda 8 Run to connect. For help, see the <a data-testid="c8run-troubleshoot-link" href={ C8RUN_TROUBLESHOOTING_URL }>troubleshooting information</a>.
        </>
      );
    }
    return null;
  };

  function handleConnectionIdChange(connectionId) {
    const connection = connections.find(c => c.id === connectionId) || NO_CONNECTION;
    handleConnectionChange(connection);
  }

  const fieldError = getConnectionFieldError();
  const description = getConnectionDescription();

  return (
    <>
      <CardHeader className="px-0">
        <CardTitle>{ renderHeader }</CardTitle>
        <a onClick={ handleManageConnections } href="#">
          Manage connections
        </a>
      </CardHeader>
      <CardContent className="px-0">
        <Field>
          <FieldLabel>Connection</FieldLabel>
          <Select
            value={ activeConnection?.id }
            onValueChange={ handleConnectionIdChange }
          >
            <SelectTrigger name="connection">
              <SelectValue placeholder="Select a connection" />
            </SelectTrigger>
            <SelectContent>
              { connectionItems.map(item => (
                <SelectItem key={ item.value } value={ item.value }>
                  { item.label }
                </SelectItem>
              )) }
              <SelectSeparator />
              <SelectItem value={ NO_CONNECTION.id }>
                Disabled (offline mode)
              </SelectItem>
            </SelectContent>
          </Select>
          { fieldError && <FieldError>{ fieldError }</FieldError> }
          { description && <FieldDescription>{ description }</FieldDescription> }
        </Field>

        <p className="form-description">
          A connection to a running <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/connect-to-camunda-8/') }>orchestration cluster</a> lets you test tasks, deploy resources, and run processes.
        </p>
      </CardContent>
    </>
  );
}
