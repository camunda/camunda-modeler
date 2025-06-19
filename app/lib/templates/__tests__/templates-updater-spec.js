/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');

const { Agent, MockAgent, setGlobalDispatcher } = require('undici');

const { isString } = require('min-dash');

const { updateConnectorTemplates } = require('..');

const userPath = path.resolve(__dirname, 'tmp');

describe.only('TemplatesUpdater', function() {

  let mockAgent;

  let marketPlaceMockPool, fooMockPool;

  beforeEach(function() {
    mockAgent = new MockAgent();

    setGlobalDispatcher(mockAgent);

    mockAgent.disableNetConnect();
  });

  afterEach(async function() {
    await mockAgent.close();

    setGlobalDispatcher(new Agent());

    await fs.promises.rm(path.resolve(__dirname, 'tmp'), { recursive: true, force: true });
  });


  it('should update templates on <client:templates-update>');


});

async function createUserData(userPath, connectorTemplates = []) {
  const connectorTemplatesDirectoryPath = getConnectorTemplatesDirectoryPath(userPath);

  await fs.promises.mkdir(connectorTemplatesDirectoryPath, { recursive: true });

  const connectorTemplatesFilePath = getConnectorTemplatesFilePath(userPath);

  const stringifiedConnectorTemplates = isString(connectorTemplates) ? connectorTemplates : JSON.stringify(connectorTemplates, null, 2);

  await fs.promises.writeFile(connectorTemplatesFilePath, stringifiedConnectorTemplates);
}

function getConnectorTemplatesDirectoryPath(userPath) {
  return path.join(userPath, 'resources/element-templates');
}

function getConnectorTemplatesFilePath(userPath) {
  return path.join(getConnectorTemplatesDirectoryPath(userPath), '.camunda-connector-templates.json');
}

async function expectConnectorTemplates(userPath, expectedConnectorTemplates) {
  const connectorTemplatesFilePath = getConnectorTemplatesFilePath(userPath);

  expect(fs.existsSync(connectorTemplatesFilePath)).to.be.true;

  const connectorTemplates = JSON.parse(await fs.promises.readFile(connectorTemplatesFilePath, 'utf8'));

  expect(connectorTemplates).to.have.length(expectedConnectorTemplates.length);

  expectedConnectorTemplates.forEach((expectedConnectorTemplate, index) => {
    expect(connectorTemplates[index]).to.eql(expectedConnectorTemplate);
  });
}

async function expectNoConnectorTemplates(userPath) {
  const connectorTemplatesFilePath = getConnectorTemplatesFilePath(userPath);

  expect(fs.existsSync(connectorTemplatesFilePath)).to.be.false;
}