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
  getClusterUrl,
  getProcessId,
  getProcessVersion
} from '../shared/util';

import * as css from './CloudLink.less';

export default function CloudLink(props) {
  const {
    endpoint,
    response
  } = props;

  const processId = getProcessId(response);

  if (!processId) {
    return null;
  }

  const clusterUrl = getClusterUrl(endpoint, response);
  const processesUrl = new URL(`${clusterUrl}/processes`);
  processesUrl.searchParams.set('process', processId);
  processesUrl.searchParams.set('version', getProcessVersion(response) || 'all');
  processesUrl.searchParams.set('active', 'true');
  processesUrl.searchParams.set('incidents', 'true');

  return (
    <div className={ css.CloudLink }>
      <div>
        Process Definition ID:
        <code>{processId}</code>
      </div>
      <a href={ processesUrl.toString() }>
        Open in Camunda Operate
      </a>
    </div>
  );
}