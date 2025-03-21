/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import Deployment from './deployment-plugin/Deployment';
import DeploymentPluginValidator from './deployment-plugin/DeploymentPluginValidator';
import ConnectionChecker from './deployment-plugin/ConnectionChecker';
import ZeebeAPI from '../../remote/ZeebeAPI';

import DeploymentPlugin from './deployment-plugin';
import StartInstancePlugin from './start-instance-plugin';

export default class ZeebePlugin extends PureComponent {
  constructor(props) {
    super(props);

    const backend = props._getGlobal('backend');

    const zeebeAPI = new ZeebeAPI(backend);

    const validator = this.validator = new DeploymentPluginValidator(zeebeAPI);
    const connectionChecker = this.connectionChecker = new ConnectionChecker(validator);

    this.deployment = new Deployment(props.config, zeebeAPI, validator, connectionChecker);
  }

  render() {
    return <React.Fragment>
      <DeploymentPlugin { ...this.props } deployment={ this.deployment } />
      <StartInstancePlugin { ...this.props } deployment={ this.deployment } />
    </React.Fragment>;
  }
}