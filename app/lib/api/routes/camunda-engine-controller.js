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
const deploymentHandler = require('../../deployment/workflow');
const bodyParser = require('body-parser');

const router = Router();
const jsonParser = bodyParser.json();

router.get('/', (req, res) => {
  res.json({
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/camunda-engine' },
      'endpoint': {
        method: 'GET',
        title: 'Get the endpoint of the Camunda engine',
        href: req.header('host') + '/camunda-engine/endpoint'
      },
      'endpoint-update': {
        method: 'PUT',
        title: 'Update the endpoint of the Camunda engine',
        href: req.header('host') + '/camunda-engine/endpoint'
      }
    }
  });
});

// retrieve the endpoint of the Camunda engine
router.get('/endpoint', (req, res) => {
  res.json({
    'endpoint': deploymentHandler.getCamundaEndpoint(),
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/camunda-engine/endpoint' },
      'update': {
        method: 'PUT',
        title: 'Update the endpoint of the Camunda engine',
        href: req.header('host') + '/camunda-engine/endpoint'
      }
    }
  });
});

// update the endpoint of the Camunda engine
router.put('/endpoint', jsonParser, function(req, res) {
  if (req.body === undefined || req.body.endpoint === undefined) {
    res.status(400).send('Endpoint has to be set!');
    return;
  }

  deploymentHandler.setCamundaEndpoint(req.body.endpoint);
  res.status(200).send();
});

module.exports = router;
