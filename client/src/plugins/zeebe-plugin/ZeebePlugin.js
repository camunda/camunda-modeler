/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import Deployment from './deployment-plugin/Deployment';
import DeploymentConnectionValidator from './deployment-plugin/DeploymentConnectionValidator';
import DeploymentConfigValidator from './deployment-plugin/DeploymentConfigValidator';
import ZeebeAPI from '../../remote/ZeebeAPI';

import DeploymentPlugin from './deployment-plugin';
import StartInstancePlugin from './start-instance-plugin';

export default function ZeebePlugin(props) {
  const { _getGlobal } = props;

  const [ deployment, setDeployment ] = useState(null);
  const [ deploymentConfigValidator, setDeploymentConfigValidator ] = useState(null);
  const [ deploymentConnectionValidator, setDeploymentConnectionValidator ] = useState(null);

  useEffect(() => {
    const backend = _getGlobal('backend');
    const config = _getGlobal('config');

    const zeebeAPI = new ZeebeAPI(backend);

    setDeployment(new Deployment(config, zeebeAPI));
    setDeploymentConfigValidator(DeploymentConfigValidator);
    setDeploymentConnectionValidator(new DeploymentConnectionValidator(zeebeAPI));
  }, []);

  if (!deployment) {
    return null;
  }

  return (
    <React.Fragment>
      <DeploymentPlugin
        { ...props }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        deploymentConnectionValidator={ deploymentConnectionValidator } />
      <StartInstancePlugin
        { ...props }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        deploymentConnectionValidator={ deploymentConnectionValidator } />
    </React.Fragment>
  );
}