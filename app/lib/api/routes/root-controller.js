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
const router = Router();

router.get('/', function(req, res) {
  res.json({ '_links': {
    'self': { method: 'GET', href: req.header('host') + '' },
    'camunda-engine': { method: 'GET', title: 'Get data about the connected Camunda engine', href: req.header('host') + '/camunda-engine' },
    'quantme': { method: 'GET', title: 'Get QuantME resources', href: req.header('host') + '/quantme' }
  } });
});

module.exports = router;

