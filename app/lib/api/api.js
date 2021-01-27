/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const express = require('express');
const routes = require('./routes');

const log = require('../log')('app:api');
const api = express();

// add defined routes of controllers
api.use('/', routes.root);
api.use('/workflows', routes.workflow);
api.use('/quantme', routes.quantme);
api.use('/quantme/qrms', routes.qrm);

// retrieve port for the API from the environment variables or use default port 8081
let port = process.env.PORT;
if (port !== undefined) {
  port = port.replace(/ /g,'');
  port = parseInt(port);

  // defined port has to be between 0 and 65536
  if (isNaN(port) || port <= 0 || port > 65535) {
    log.warn('Passed invalid port for REST API as environment variable: \'' + port + '\'');
    port = 8081;
    log.info('Starting REST API on default port 8081!');
  } else {
    log.info('Starting REST API on defined port: %i', port);
  }
} else {
  log.info('No port defined in environment variables. Starting REST API on default port 8081!');
  port = 8081;
}

// start REST API
api.listen(port);
