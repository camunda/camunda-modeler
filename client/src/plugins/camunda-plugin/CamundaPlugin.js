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

import DeploymentTool from './deployment-tool';
import StartInstanceTool from './start-instance-tool';

/**
 * A plugin to handle both Camunda BPM related tools
 * a) DeploymentTool
 * b) StartInstanceTool
 */
export default class CamundaPlugin extends PureComponent {

  deployRef = React.createRef();

  render() {

    const deployService = new DeployService(this.deployRef);

    return <React.Fragment>
      <DeploymentTool
        ref={ this.deployRef }
        { ...this.props } />

      <StartInstanceTool
        ref={ this.startInstanceRef }
        deployService={ deployService }
        { ...this.props } />
    </React.Fragment>;
  }
}

class DeployService {

  constructor(ref) {
    this.deploymentRef = ref;
  }

  deployWithConfiguration = (...args) => this.current().deployWithConfiguration(...args);
  getSavedDeployConfiguration = (...args) => this.current().getSavedConfiguration(...args);
  getDeployConfigurationFromUserInput = (...args) => this.current().getConfigurationFromUserInput(...args);
  saveDeployConfiguration = (...args) => this.current().saveConfiguration(...args);
  canDeployWithConfiguration = (...args) => this.current().canDeployWithConfiguration(...args);
  getVersion = (...args) => this.current().getVersion(...args);
  closeOverlay = (...args) => this.current().closeOverlay(...args);

  current() {
    return this.deploymentRef.current;
  }

}
