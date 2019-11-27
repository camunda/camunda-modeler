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

/**
 * A plugin to handle both Camunda BPM related tools
 * a) DeploymentTool
 * b) todo(pinussilvestrus): StartInstanceTool (to be implemented),
 * cf. https://github.com/camunda/camunda-modeler/issues/1552
 */
export default class CamundaPlugin extends PureComponent {

    deployRef = React.createRef();

    render() {
      return <React.Fragment>
        <DeploymentTool
          ref={ this.deployRef }
          { ...this.props } />
      </React.Fragment>;
    }
}