/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const { app } = require('electron');
const deploymentConfig = require('../DeploymentConfig');

/**
 * Get the endpoint of the configured OpenTOSCA container
 *
 * @return {string} the currently specified endpoint of the OpenTOSCA container
 */
module.exports.getOpenTOSCAEndpoint = function() {
  if (deploymentConfig.opentoscaEndpoint === undefined) {
    return '';
  }
  return deploymentConfig.opentoscaEndpoint;
};

/**
 * Set the endpoint of the OpenTOSCA container
 *
 * @param opentoscaEndpoint the endpoint of the OpenTOSCA container
 */
module.exports.setOpenTOSCAEndpoint = function(opentoscaEndpoint) {
  if (opentoscaEndpoint !== null && opentoscaEndpoint !== undefined) {
    deploymentConfig.opentoscaEndpoint = opentoscaEndpoint.replace(/\/$/, '');
    app.emit('menu:action', 'opentoscaEndpointChanged', deploymentConfig.opentoscaEndpoint);
  }
};

