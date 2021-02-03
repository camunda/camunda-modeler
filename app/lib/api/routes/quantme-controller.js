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

router.get('/', (req, res) => {
  res.json({ '_links': {
    'self': { method: 'GET', href: req.header('host') + '/quantme' },
    'qrms': { method: 'GET', title: 'Get all available QRMs', href: req.header('host') + '/quantme/qrms' },
    'workflows': { method: 'GET', title: 'Get all transformed workflows', href: req.header('host') + '/quantme/workflows' }
  } });
});

module.exports = router;
