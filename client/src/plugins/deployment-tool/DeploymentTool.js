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

import { Fill } from '../../app/slot-fill';

export default class DeploymentTool extends PureComponent {

  render() {

    return (
      <React.Fragment>
        <Fill name="toolbar" group="extension">
          🤩
        </Fill>
      </React.Fragment>
    );
  }
}
