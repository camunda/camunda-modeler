/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
