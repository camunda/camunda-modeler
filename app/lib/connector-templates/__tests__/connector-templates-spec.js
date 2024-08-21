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


describe('updateConnectorTemplates', function() {

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


  describe('updating', function() {

    beforeEach(function() {
      marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

      marketPlaceMockPool.intercept({ path: '/api/v1/connectors?creatorType=camunda' }).reply(200, {
        items: [
          { id: 1, name: 'Foo' },
          { id: 2, name: 'Bar' },
          { id: 3, name: 'Baz' }
        ]
      });

      marketPlaceMockPool.intercept({ path: '/api/v1/connectors/1' }).reply(200, {
        templates: [
          { url: 'https://foo.com/1' }
        ]
      });

      marketPlaceMockPool.intercept({ path: '/api/v1/connectors/2' }).reply(200, {
        templates: [
          { url: 'https://foo.com/2' }
        ]
      });

      marketPlaceMockPool.intercept({ path: '/api/v1/connectors/3' }).reply(200, {
        templates: [
          { url: 'https://foo.com/3' }
        ]
      });

      fooMockPool = mockAgent.get('https://foo.com');

      fooMockPool.intercept({ path: '/1' }).reply(200, {
        $schema: 'https://foo.com',
        id: '1'
      });

      fooMockPool.intercept({ path: '/2' }).reply(200, {
        $schema: 'https://foo.com',
        id: '2',
        version: 1
      });

      fooMockPool.intercept({ path: '/3' }).reply(200, {
        $schema: 'https://foo.com',
        id: '3',
        version: 2
      });
    });


    it('should update connector templates (keep existing)', async function() {

      // given
      const sendSpy = sinon.spy();

      const renderer = {
        send: sendSpy
      };

      await createUserData(userPath, [
        { $schema: 'https://foo.com', id: '1', version: 1 },
        { $schema: 'https://foo.com', id: '2', version: 1 },
        { $schema: 'https://foo.com', id: '3', version: 1 },
        { $schema: 'https://foo.com', id: '4', version: 1 }
      ]);

      // when
      await updateConnectorTemplates(renderer, userPath);

      // then
      expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', true, []);

      expectConnectorTemplates(userPath, [
        { $schema: 'https://foo.com', id: '1' }, // new, added
        { $schema: 'https://foo.com', id: '1', version: 1 }, // existing, kept
        { $schema: 'https://foo.com', id: '2', version: 1 }, // existing, kept
        { $schema: 'https://foo.com', id: '3', version: 1 }, // existing, kept
        { $schema: 'https://foo.com', id: '3', version: 2 }, // new, added
        { $schema: 'https://foo.com', id: '4', version: 1 } // existing, kept
      ]);
    });


    it('should update connector templates (no existing)', async function() {

      // given
      const sendSpy = sinon.spy();

      const renderer = {
        send: sendSpy
      };

      // when
      await updateConnectorTemplates(renderer, userPath);

      // then
      expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', true, []);

      expectConnectorTemplates(userPath, [
        { $schema: 'https://foo.com', id: '1' },
        { $schema: 'https://foo.com', id: '2', version: 1 },
        { $schema: 'https://foo.com', id: '3', version: 2 }
      ]);
    });


    it('should update connector templates (no new)', async function() {

      // given
      const sendSpy = sinon.spy();

      const renderer = {
        send: sendSpy
      };

      await createUserData(userPath, [
        { $schema: 'https://foo.com', id: '1' },
        { $schema: 'https://foo.com', id: '2', version: 1 },
        { $schema: 'https://foo.com', id: '3', version: 2 }
      ]);

      // when
      await updateConnectorTemplates(renderer, userPath);

      // then
      expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', false, []);

      expectConnectorTemplates(userPath, [
        { $schema: 'https://foo.com', id: '1' },
        { $schema: 'https://foo.com', id: '2', version: 1 },
        { $schema: 'https://foo.com', id: '3', version: 2 }
      ]);
    });


    it('should update connector templates (existing broken)', async function() {

      // given
      const sendSpy = sinon.spy();

      const renderer = {
        send: sendSpy
      };

      await createUserData(userPath, '[{]');

      // when
      await updateConnectorTemplates(renderer, userPath);

      // then
      expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success');

      expectConnectorTemplates(userPath, [
        { $schema: 'https://foo.com', id: '1' },
        { $schema: 'https://foo.com', id: '2', version: 1 },
        { $schema: 'https://foo.com', id: '3', version: 2 }
      ]);
    });

  });


  describe('error handling', function() {

    describe('marketplace /api/v1/connectors error', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors?creatorType=camunda' }).reply(500);
      });


      it('should not update connector templates', async function() {

        // given
        const sendSpy = sinon.spy();

        const renderer = {
          send: sendSpy
        };

        // when
        await updateConnectorTemplates(renderer, userPath);

        // then
        expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-error');

        expectNoConnectorTemplates(userPath);
      });

    });


    describe('marketplace /api/v1/connectors/{id} error', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors?creatorType=camunda' }).reply(200, {
          items: [
            { id: 1, name: 'Foo' },
            { id: 2, name: 'Bar' },
            { id: 3, name: 'Baz' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/1' }).reply(500);

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/2' }).reply(200, {
          templates: [
            { url: 'https://foo.com/2' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/3' }).reply(200, {
          templates: [
            { url: 'https://foo.com/3' }
          ]
        });

        fooMockPool = mockAgent.get('https://foo.com');

        fooMockPool.intercept({ path: '/2' }).reply(200, {
          $schema: 'https://foo.com',
          id: '2',
          version: 1
        });

        fooMockPool.intercept({ path: '/3' }).reply(200, {
          $schema: 'https://foo.com',
          id: '3',
          version: 2
        });
      });


      it('should update connector templates with warnings', async function() {

        // given
        const sendSpy = sinon.spy();

        const renderer = {
          send: sendSpy
        };

        // when
        await updateConnectorTemplates(renderer, userPath);

        // then
        expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', true, [
          'Unable to fetch template Foo'
        ]);

        expectConnectorTemplates(userPath, [
          { $schema: 'https://foo.com', id: '2', version: 1 },
          { $schema: 'https://foo.com', id: '3', version: 2 }
        ]);
      });

    });


    describe('error fetching connector', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors?creatorType=camunda' }).reply(200, {
          items: [
            { id: 1, name: 'Foo' },
            { id: 2, name: 'Bar' },
            { id: 3, name: 'Baz' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/1' }).reply(200, {
          templates: [
            { url: 'https://foo.com/1' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/2' }).reply(200, {
          templates: [
            { url: 'https://foo.com/2' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/3' }).reply(200, {
          templates: [
            { url: 'https://foo.com/3' }
          ]
        });

        fooMockPool = mockAgent.get('https://foo.com');

        fooMockPool.intercept({ path: '/1' }).reply(500);

        fooMockPool.intercept({ path: '/2' }).reply(200, {
          $schema: 'https://foo.com',
          id: '2',
          version: 1
        });

        fooMockPool.intercept({ path: '/3' }).reply(200, {
          $schema: 'https://foo.com',
          id: '3',
          version: 2
        });
      });


      it('should update connector templates with warnings', async function() {

        // given
        const sendSpy = sinon.spy();

        const renderer = {
          send: sendSpy
        };

        // when
        await updateConnectorTemplates(renderer, userPath);

        // then
        expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', true, [
          'Unable to fetch template Foo'
        ]);

        expectConnectorTemplates(userPath, [
          { $schema: 'https://foo.com', id: '2', version: 1 },
          { $schema: 'https://foo.com', id: '3', version: 2 }
        ]);
      });

    });


    describe('error parsing connector', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors?creatorType=camunda' }).reply(200, {
          items: [
            { id: 1, name: 'Foo' },
            { id: 2, name: 'Bar' },
            { id: 3, name: 'Baz' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/1' }).reply(200, {
          templates: [
            { url: 'https://foo.com/1' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/2' }).reply(200, {
          templates: [
            { url: 'https://foo.com/2' }
          ]
        });

        marketPlaceMockPool.intercept({ path: '/api/v1/connectors/3' }).reply(200, {
          templates: [
            { url: 'https://foo.com/3' }
          ]
        });

        fooMockPool = mockAgent.get('https://foo.com');

        fooMockPool.intercept({ path: '/1' }).reply(200, '<!DOCTYPE html>');

        fooMockPool.intercept({ path: '/2' }).reply(200, {
          $schema: 'https://foo.com',
          id: '2',
          version: 1
        });

        fooMockPool.intercept({ path: '/3' }).reply(200, {
          $schema: 'https://foo.com',
          id: '3',
          version: 2
        });
      });


      it('should update connector templates with warnings', async function() {

        // given
        const sendSpy = sinon.spy();

        const renderer = {
          send: sendSpy
        };

        // when
        await updateConnectorTemplates(renderer, userPath);

        // then
        expect(sendSpy).to.have.been.calledWith('client:connector-templates-update-success', true, [
          'Unable to fetch template Foo'
        ]);

        expectConnectorTemplates(userPath, [
          { $schema: 'https://foo.com', id: '2', version: 1 },
          { $schema: 'https://foo.com', id: '3', version: 2 }
        ]);
      });

    });

  });

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
