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

const express = require('express');
const routes = require('./routes');

const quantumWorkflowController = require('./routes/quantum-workflow-controller');

const log = require('../log')('app:api');
const api = express();

// add defined routes of controllers
api.use('/', routes.root);
api.use('/config', routes.config);
api.use('/quantme', routes.quantme);
api.use('/quantme/qrms', routes.qrm);
api.use('/quantme/workflows', routes.quantumWorkflow.default);

// retrieve port for the API from the environment variables or use default port 8888
let port = process.env.PORT;
if (port !== undefined) {
  port = port.replace(/ /g, '');
  port = parseInt(port);

  // defined port has to be between 0 and 65536
  if (isNaN(port) || port <= 0 || port > 65535) {
    log.warn('Passed invalid port for REST API as environment variable: \'' + port + '\'');
    port = 8888;
    log.info('Starting REST API on default port 8888!');
  } else {
    log.info('Starting REST API on defined port: %i', port);
  }
} else {
  log.info('No port defined in environment variables. Starting REST API on default port 8888!');
  port = 8888;
}

// start REST API
const host = '0.0.0.0';
api.listen(port, host, function(err) {
  if (err) return log.error(err);
  log.info('Listening at http://%s:%s', host, port);
});

/**
 * Add the result of a long-running task to the result set of the corresponding controller
 *
 * @param targetRoute the route identifying the controller the long-running task belongs to
 * @param id the id of the long-running task
 * @param args the results of the long-running task
 */
module.exports.addResultOfLongRunningTask = function(targetRoute, id, args) {
  log.info('Received result for long running task for route: \'%s\'. Forwarding to controller!', targetRoute);

  if (targetRoute === null) {
    log.error('Unable to forward result of long running task with targetRoute equal to null!');
    return;
  }

  switch (targetRoute) {
  case '/quantme/workflows':
    quantumWorkflowController.addResultOfLongRunningTask(id, args);
    break;
  default:
    log.error('Unable to forward result of long running task with targetRoute: ' + targetRoute);
  }
};
