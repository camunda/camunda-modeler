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

import DeploymentButton from './Deployment/Deployment';

import Run from './Run';
import EngineInfo from './EngineInfo';

export default function(props) {
  return <>
    <EngineInfo />
    <DeploymentButton key={ props.id } { ...props }></DeploymentButton>
    <Run key={ props.id } { ...props }></Run>
  </>;

}

