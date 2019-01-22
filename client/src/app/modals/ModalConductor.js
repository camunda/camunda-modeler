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
