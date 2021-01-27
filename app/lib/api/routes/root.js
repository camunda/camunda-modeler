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

const { Router } = require('express');
const router = Router();

router.get('/', function(req, res) {
  res.json({ '_links': {
    'self': { method: 'GET', href: req.header('host') + '' },
    'workflows': { method: 'GET', title: 'Get workflows', href: req.header('host') + '/workflows' },
    'quantme': { method: 'GET', title: 'Get QuantME resources', href: req.header('host') + '/quantme' }
  } });
});

module.exports = router;

