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
const qrmHandler = require('../../quantme/qrm-manager');
const bodyParser = require('body-parser');

const router = Router();
const jsonParser = bodyParser.json();

router.get('/', (req, res) => {
  res.json({
    qrms: qrmHandler.getQRMs(),
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/qrms' },
      'update': {
        method: 'POST',
        title: 'Reload the available QRMs form the specified repository',
        href: req.header('host') + '/quantme/qrms/update'
      },
      'username': {
        method: 'GET',
        title: 'Get the username for the QRM repository',
        href: req.header('host') + '/quantme/qrms/username'
      },
      'repository': {
        method: 'GET',
        title: 'Get the name of the QRM repository',
        href: req.header('host') + '/quantme/qrms/repository'
      }
    }
  });
});

// retrieve current username for the QRM repository
router.get('/username', (req, res) => {
  res.json({
    'username': qrmHandler.getQRMRepositoryUserName(),
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/qrms/username' },
      'update': {
        method: 'PUT',
        title: 'Update the username for the QRM repository',
        href: req.header('host') + '/quantme/qrms/username'
      }
    }
  });
});

// update the username for the QRM repository
router.put('/username', jsonParser, function(req, res) {
  if (req.body === undefined || req.body.username === undefined) {
    res.status(400).send('Username has to be set!');
    return;
  }

  qrmHandler.setQRMUserName(req.body.username);
  res.status(200).send();
});

// retrieve current repository name for the QRM repository
router.get('/repository', (req, res) => {
  res.json({
    'name': qrmHandler.getQRMRepositoryName(),
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/qrms/repository' },
      'update': {
        method: 'PUT',
        title: 'Update the name of the QRM repository',
        href: req.header('host') + '/quantme/qrms/repository'
      }
    }
  });
});

// update the repository name for the QRM repository
router.put('/repository', jsonParser, function(req, res) {
  if (req.body === undefined || req.body.repository === undefined) {
    res.status(400).send('Repository has to be set!');
    return;
  }

  qrmHandler.setQRMRepositoryName(req.body.repository);
  res.status(200).send();
});

// update the current QRMs from the repository
router.post('/update', jsonParser, function(req, res) {
  qrmHandler.updateQRMs().then(r => console.log('Finished updating QRMs over API!'));
  res.status(201).send();
});

module.exports = router;
