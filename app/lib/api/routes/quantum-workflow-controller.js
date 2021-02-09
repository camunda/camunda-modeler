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
const deploymentHandler = require('../../deployment/workflow');

// use default options
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

  // add links to all workflows
  for (let i = 0; i < workflows.length; i++) {
    let workflow = workflows[i];
    body._links[workflow.id] = { method: 'GET', href: req.header('host') + '/quantme/workflows/' + workflow.id };
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

  // search the workflow with the given id
  let id = req.params.id;
  let workflow = findWorkflowById(id);

  if (workflow === undefined) {
    res.status(404).send();
    return;
  }

  // assemble links for the workflow object
  let links = {
    'self': { method: 'GET', href: req.header('host') + '/quantme/workflows/' + id },
    'download': { method: 'GET', href: req.header('host') + '/quantme/workflows/' + id + '/download' }
  };
  if (workflow.status === 'transformed') {
    links['deploy'] = { method: 'POST', href: req.header('host') + '/quantme/workflows/' + id + '/deploy' };
  }

  res.json({
    workflow: workflow,
    '_links': links
  });
});

router.get('/:id/download', (req, res) => {

  // search the workflow with the given id
  let id = req.params.id;
  let workflow = findWorkflowById(id);

  if (workflow === undefined) {
    res.status(404).send();
    return;
  }

  res.attachment('workflow' + id + '.bpmn');
  res.type('bpmn');
  res.send(workflow.xml);
});

router.post('/:id/deploy', (req, res) => {

  // search the workflow with the given id
  let id = req.params.id;
  let workflow = findWorkflowById(id);

  if (workflow === undefined) {
    res.status(404).send();
    return;
  }

  if (workflow.status !== 'transformed') {
    res.status(400).send('Only workflows in status \'transformed\' can be deployed. Current status: ' + workflow.status);
    return;
  }

  // start deployment
  workflow.status = 'deploying';
  deploymentHandler.deployWorkflow(id, workflow.xml).then((result) => {

    // update stored workflow
    workflow.status = result.status;
    if (!(workflow.status === 'failed')) {
      workflow.deployedProcessDefinition = result.deployedProcessDefinition;
    }
    updateWorkflow(workflow);
  });

  res.json({
    workflow: workflow,
    '_links': {
      'self': { method: 'GET', href: req.header('host') + '/quantme/workflows/' + id },
      'download': { method: 'GET', href: req.header('host') + '/quantme/workflows/' + id + '/download' }
    }
  });
});

/**
 * Find the workflow with the given id
 *
 * @return {*} the workflow object with the given id if available or 'undefined' otherwise
 */
function findWorkflowById(id) {
  let workflow = undefined;
  for (let i = 0; i < workflows.length; i++) {
    let searchedWorkflow = workflows[i];
    if (parseInt(searchedWorkflow.id) === parseInt(id)) {
      workflow = searchedWorkflow;
      break;
    }
  }
  return workflow;
}

/**
 * Update the given workflow object with new data
 *
 * @param workflow the workflow to update
 */
function updateWorkflow(workflow) {

  // remove object from list
  workflows = workflows.filter(function(obj) {
    return obj.id !== id;
  });

  // add new version
  workflows.push(workflow);
}

module.exports.addResultOfLongRunningTask = function(id, args) {
  log.info('Updating workflow object with id: ' + id);

  // get element with the specified id
  const workflow = workflows.find(o => o.id === id);

  if (workflow === undefined) {
    log.error('Unable to find workflow object with id: ' + id);
    return;
  }

  // update stored workflow
  workflow.status = args.status;
  if (!(workflow.status === 'failed')) {
    workflow.xml = args.xml;
  }
  updateWorkflow(workflow);
};

module.exports.default = router;
