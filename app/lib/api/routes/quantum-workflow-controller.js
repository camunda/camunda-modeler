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
const { Router } = require('express');
const fileUpload = require('express-fileupload');
const router = Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// use default oprions
router.use(fileUpload({}));

const log = require('../../log')('app:api:quantum-workflow-controller');

let id = 1;
let workflows = [];

router.get('/', (req, res) => {
  let body = {
    workflows: workflows,
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/workflows' },
      'transform': {
        method: 'POST',
        title: 'Transform a given QuantME workflow into a native workflow!',
        href: req.header('host') + '/quantme/workflows'
      },
    }
  };

  // add links to all transformed workflows
  for (let i = 0; i < workflows.length; i++) {
    let workflow = workflows[i];

    if (workflow.status === 'finished') {
      body._links[workflow.id] = { method: 'GET', href: req.header('host') + '/quantme/workflows/' + workflow.id };
    }
  }

  res.json(body);
});

// transform the given QuantME workflow model into a native workflow model
router.post('/', jsonParser, function(req, res) {
  let workflowXml = undefined;
  if (req.body === undefined || req.body.xml === undefined) {
    if (!req.files || Object.keys(req.files).length !== 1) {

      // either xml in json or file with the diagram must be defined
      res.status(400).send('Xml has to be set or file must be uploaded!');
      return;
    } else {
      log.info('Loading input from file...');
      workflowXml = req.files[(Object.keys(req.files)[0])].data.toString('utf8');
    }
  } else {
    workflowXml = req.body.xml;
  }

  // add workflow to list and increase id for the next request
  workflows.push({ id: id, status: 'transforming', xml: workflowXml });
  app.emit('menu:action', 'transformWorkflow', { id: id, xml: workflowXml, returnPath: '/quantme/workflows' });
  res.status(201).json({ id: id });
  id++;
});

router.get('/:id', (req, res) => {
  let id = req.params.id;

  // search the workflow with the given id
  let workflow = undefined;
  for (let i = 0; i < workflows.length; i++) {
    let searchedWorkflow = workflows[i];
    if (parseInt(searchedWorkflow.id) === parseInt(id)) {
      workflow = searchedWorkflow;
      break;
    }
  }

  if (workflow === undefined) {
    res.status(404).send();
    return;
  }

  res.json({
    workflow: workflow,
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/workflows/' + id }
    }
  });
});

router.get('/:id/download', (req, res) => {
  let id = req.params.id;

  // search the workflow with the given id
  let workflow = undefined;
  for (let i = 0; i < workflows.length; i++) {
    let searchedWorkflow = workflows[i];
    if (parseInt(searchedWorkflow.id) === parseInt(id)) {
      workflow = searchedWorkflow;
      break;
    }
  }

  if (workflow === undefined) {
    res.status(404).send();
    return;
  }

  res.attachment('workflow' + id + '.bpmn');
  res.type('bpmn');
  res.send(workflow.xml);
});

module.exports.addResultOfLongRunningTask = function(id, args) {
  log.info('Updating workflow object with id: ' + id);

  // get element with the specified id
  const workflow = workflows.find(o => o.id === id);

  if (workflow === undefined) {
    log.error('Unable to find workflow object with id: ' + id);
    return;
  }

  // filter object from list
  workflows = workflows.filter(function(obj) {
    return obj.id !== id;
  });

  // add updated workflow
  workflow.status = args.status;
  if (!(workflow.status === 'failed')) {
    workflow.xml = args.xml;
  }
  workflows.push(workflow);
};

module.exports.default = router;
