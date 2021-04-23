/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  assign
} from 'min-dash';

class Mock {

  constructor(overrides = {}) {
    assign(this, overrides);
  }

}

export class DeploymentService extends Mock {

  deployWithConfiguration() {}

  getSavedDeployConfiguration() {}

  getDeployConfigurationFromUserInput() {}

  saveDeployConfiguration() {}

  getVersion() {}

  canDeployWithConfiguration() {
    return true;
  }
}
