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

module.exports = {
  camundaEndpoint: process.env.CAMUNDA_ENDPOINT || 'http://localhost:8080/engine-rest',
  opentoscaEndpoint: process.env.OPENTOSCA_ENDPOINT || 'http://localhost:1337/csars',
  wineryEndpoint: process.env.WINERY_ENDPOINT || 'http://localhost:8081/winery',
};
