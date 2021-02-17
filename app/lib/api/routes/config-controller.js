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

const { Router } = require('express');
const deploymentHandler = require('../../deployment');
const bodyParser = require('body-parser');

const router = Router();
const jsonParser = bodyParser.json();

router.get('/', (req, res) => {
  res.json({
    'camunda-endpoint': deploymentHandler.getCamundaEndpoint(),
    'winery-endpoint': deploymentHandler.getWineryEndpoint(),
    'opentosca-endpoint': deploymentHandler.getOpenTOSCAEndpoint(),
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/config' },
      'endpoint-update': {
        method: 'PUT',
        title: 'Update the configured endpoints',
        href: req.header('host') + '/config'
      }
    }
  });
});

// update the endpoint of the Camunda engine
router.put('/', jsonParser, function(req, res) {
  if (req.body === undefined || (req.body.camundaEndpoint === undefined && req.body.wineryEndpoint === undefined && req.body.opentoscaEndpoint === undefined)) {
    res.status(400).send('Either camundaEndpoint, wineryEndpoint, or opentoscaEndpoint has to be set!');
    return;
  }

  // update the given endpoints
  if (req.body.camundaEndpoint !== undefined) {
    deploymentHandler.setCamundaEndpoint(req.body.camundaEndpoint);
  }
  if (req.body.wineryEndpoint !== undefined) {
    deploymentHandler.setWineryEndpoint(req.body.wineryEndpoint);
  }
  if (req.body.opentoscaEndpoint !== undefined) {
    deploymentHandler.setOpenTOSCAEndpoint(req.body.opentoscaEndpoint);
  }
  res.status(200).send();
});

module.exports = router;
