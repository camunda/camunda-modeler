import React from 'react';

import { DeployDiagramModal } from './deploy-diagram';


const DEPLOY_DIAGRAM = 'DEPLOY_DIAGRAM';


const ModalConductor = props => {
  switch (props.currentModal) {
  case DEPLOY_DIAGRAM:
    return <DeployDiagramModal { ...props } />;
  default:
    return null;
  }
};

export default ModalConductor;
