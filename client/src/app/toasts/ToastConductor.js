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

import { WarningsToast } from './warnings';

const WARNINGS = 'WARNINGS';


const ToastConductor = props => {
  switch (props.currentToast) {
  case WARNINGS:
    return <WarningsToast { ...props } />;
  default:
    return null;
  }
};

export default ToastConductor;
