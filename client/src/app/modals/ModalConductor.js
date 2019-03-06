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

import { DeployDiagramModal } from './deploy-diagram';
import { KeyboardShortcutsModal } from './keyboard-shortcuts';


const DEPLOY_DIAGRAM = 'DEPLOY_DIAGRAM';
const KEYBOARD_SHORTCUTS = 'KEYBOARD_SHORTCUTS';


const ModalConductor = props => {
  switch (props.currentModal) {
  case DEPLOY_DIAGRAM:
    return <DeployDiagramModal { ...props } />;
  case KEYBOARD_SHORTCUTS:
    return <KeyboardShortcutsModal { ...props } />;
  default:
    return null;
  }
};

export default ModalConductor;
