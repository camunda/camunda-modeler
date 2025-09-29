/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';

import ConnectionManagerPlugin from './connection-manager-plugin';
import DeploymentPlugin from './deployment-plugin';
import StartInstancePlugin from './start-instance-plugin';

export default function ZeebePlugin(props) {
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(/** @type {import('../deployment-plugin/types').ConnectionCheckResult} */ (null));
  return (
    <React.Fragment>
      <ConnectionManagerPlugin { ...props } connectionCheckResult={ connectionCheckResult } setConnectionCheckResult={ setConnectionCheckResult } />
      <DeploymentPlugin { ...props } connectionCheckResult={ connectionCheckResult } />
      <StartInstancePlugin { ...props } connectionCheckResult={ connectionCheckResult } />
    </React.Fragment>
  );
}