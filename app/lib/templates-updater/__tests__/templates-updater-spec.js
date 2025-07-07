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

const { TemplatesUpdater } = require('../templates-updater');

const { isTemplateCompatible } = require('../util');

const userPath = path.resolve(__dirname, 'tmp');

const mockTemplates = require('./mock-templates.json');

describe('TemplatesUpdater', function() {

  let mockAgent;

  let marketPlaceMockPool, fooMockPool, log;

  beforeEach(async function() {
    await fs.promises.rm(path.resolve(__dirname, 'tmp'), { recursive: true, force: true });

    mockAgent = new MockAgent().compose((dispatch) => {
      return (dispatchOptions, handler) => {
        log.push(dispatchOptions);

        return dispatch(dispatchOptions, handler);
      };
    });

    setGlobalDispatcher(mockAgent);

    mockAgent.disableNetConnect();

    log = [];
  });

  afterEach(async function() {
    await mockAgent.close();

    setGlobalDispatcher(new Agent());

    await fs.promises.rm(path.resolve(__dirname, 'tmp'), { recursive: true, force: true });
  });


  let renderer, config, templatesUpdater;

  beforeEach(function() {
    renderer = {
      on: sinon.spy(),
      send: sinon.spy()
    };

    config = {
      get: sinon.stub().returns({}),
      set: sinon.stub().resolves()
    };

    templatesUpdater = new TemplatesUpdater(renderer, config, userPath);
  });


  describe('updating', function() {

    beforeEach(function() {
      marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

      fooMockPool = mockAgent.get('https://foo.com');

      const marketPlaceMockReplyData = {};

      for (const template of mockTemplates) {
        if (!marketPlaceMockReplyData[template.id]) {
          marketPlaceMockReplyData[template.id] = [];
        }

        const templateMetadata = {
          version: template.version,
          ref: `https://foo.com/ootb-connectors?id=${template.id}&version=${template.version}`,
        };

        if (template.engines) {
          templateMetadata.engine = template.engines;
        }

        marketPlaceMockReplyData[template.id].push(templateMetadata);

        for (const template of mockTemplates) {
          fooMockPool.intercept({ path: `/ootb-connectors?id=${template.id}&version=${template.version}` }).reply(200, template);
        }
      }

      marketPlaceMockPool.intercept({ path: '/api/v1/ootb-connectors' }).reply(200, marketPlaceMockReplyData);
    });


    it('should update templates on <client:templates-update>', function() {

      // then
      expect(renderer.on).to.have.been.calledWith('client:templates-update', sinon.match.func);
    });


    it('should update templates (no existing)', async function() {

      // when
      await templatesUpdater.update('8.8');

      // then
      expect(renderer.send).to.have.been.calledWith('client:templates-update-success');

      expectConnectorTemplates(userPath, mockTemplates);
    });


    it('should update templates (no existing, compatible only)', async function() {

      // when
      await templatesUpdater.update('8.6');

      // then
      expect(renderer.send).to.have.been.calledWith('client:templates-update-success');

      expectConnectorTemplates(userPath, mockTemplates.filter(template => isTemplateCompatible(template, '8.6')));
    });


    it('should update templates (existing, ref unchanged)', async function() {

      // given
      await createUserData(userPath, [
        mockTemplates.find(template => template.id === 'foo' && template.version === 1)
      ]);

      config.get.returns({
        cachedRefs: {
          foo: {
            1: 'https://foo.com/ootb-connectors?id=foo&version=1'
          }
        }
      });

      // when
      await templatesUpdater.update('8.8');

      // then
      expect(renderer.send).to.have.been.calledWith('client:templates-update-success');

      expectConnectorTemplates(userPath, mockTemplates);

      // expect that we don't fetch the template again
      expect(log.find(entry => entry.path === '/ootb-connectors?id=foo&version=1')).not.to.exist;

      expect(config.set).to.have.been.calledWithMatch('templatesUpdater', {
        cachedRefs: {
          foo: {
            1: 'https://foo.com/ootb-connectors?id=foo&version=1'
          }
        }
      });
    });


    it('should update templates (existing, ref changed)', async function() {

      // given
      await createUserData(userPath, [
        mockTemplates.find(template => template.id === 'foo' && template.version === 1)
      ]);

      config.get.returns({
        cachedRefs: {
          foo: {
            1: 'foo'
          }
        }
      });

      // when
      await templatesUpdater.update('8.8');

      // then
      expect(renderer.send).to.have.been.calledWith('client:templates-update-success');

      expectConnectorTemplates(userPath, mockTemplates);

      // expect that we don't fetch the template again
      expect(log.find(entry => entry.path === '/ootb-connectors?id=foo&version=1')).to.exist;

      expect(config.set).to.have.been.calledWithMatch('templatesUpdater', {
        cachedRefs: {
          foo: {
            1: 'https://foo.com/ootb-connectors?id=foo&version=1'
          }
        }
      });
    });


    it('should update templates (existing broken)', async function() {

      // given
      await createUserData(userPath, '[{]');

      // when
      await templatesUpdater.update('8.8');

      // then
      expect(renderer.send).to.have.been.calledWith('client:templates-update-success');

      expectConnectorTemplates(userPath, mockTemplates);
    });

  });


  describe('error handling', function() {

    describe('marketplace /api/v1/connectors error', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/ootb-connectors' }).reply(500);
      });


      it('should not update connector templates', async function() {

        // when
        const { hasNew, warnings } = await templatesUpdater.update('8.8');

        // then
        expect(hasNew).to.be.false;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to fetch templates from https://marketplace.cloud.camunda.io/api/v1/ootb-connectors (HTTP 500)');

        expect(renderer.send).to.have.been.calledWith(
          'client:templates-update-success',
          false,
          [
            'Failed to fetch templates from https://marketplace.cloud.camunda.io/api/v1/ootb-connectors (HTTP 500)'
          ]
        );

        expectNoConnectorTemplates(userPath);
      });

    });


    describe('error fetching connector', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        fooMockPool = mockAgent.get('https://foo.com');

        const marketPlaceMockReplyData = {};

        for (const template of mockTemplates) {
          if (!marketPlaceMockReplyData[template.id]) {
            marketPlaceMockReplyData[template.id] = [];
          }

          const templateMetadata = {
            version: template.version,
            ref: `https://foo.com/ootb-connectors?id=${template.id}&version=${template.version}`,
          };

          if (template.engines) {
            templateMetadata.engine = template.engines;
          }

          marketPlaceMockReplyData[template.id].push(templateMetadata);

          for (const template of mockTemplates) {

            if (template.id === 'foo' && template.version === 1) {
              fooMockPool.intercept({ path: `/ootb-connectors?id=${template.id}&version=${template.version}` }).reply(404);
            } else {
              fooMockPool.intercept({ path: `/ootb-connectors?id=${template.id}&version=${template.version}` }).reply(200, template);
            }
          }
        }

        marketPlaceMockPool.intercept({ path: '/api/v1/ootb-connectors' }).reply(200, marketPlaceMockReplyData);
      });


      it('should update connector templates with warnings', async function() {

        // when
        const { hasNew, warnings } = await templatesUpdater.update('8.8');

        // then
        expect(hasNew).to.be.true;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to fetch template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)');

        expect(renderer.send).to.have.been.calledWith(
          'client:templates-update-success',
          true,
          [
            'Failed to fetch template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)'
          ]
        );

        expectConnectorTemplates(userPath, mockTemplates.filter(template => template.id !== 'foo' || template.version !== 1));
      });

    });


    describe('error parsing connector', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        fooMockPool = mockAgent.get('https://foo.com');

        const marketPlaceMockReplyData = {};

        for (const template of mockTemplates) {
          if (!marketPlaceMockReplyData[template.id]) {
            marketPlaceMockReplyData[template.id] = [];
          }

          const templateMetadata = {
            version: template.version,
            ref: `https://foo.com/ootb-connectors?id=${template.id}&version=${template.version}`,
          };

          if (template.engines) {
            templateMetadata.engine = template.engines;
          }

          marketPlaceMockReplyData[template.id].push(templateMetadata);

          for (const template of mockTemplates) {

            if (template.id === 'foo' && template.version === 1) {
              fooMockPool.intercept({ path: `/ootb-connectors?id=${template.id}&version=${template.version}` }).reply(200, '[{]');
            } else {
              fooMockPool.intercept({ path: `/ootb-connectors?id=${template.id}&version=${template.version}` }).reply(200, template);
            }
          }
        }

        marketPlaceMockPool.intercept({ path: '/api/v1/ootb-connectors' }).reply(200, marketPlaceMockReplyData);
      });


      it('should update connector templates with warnings', async function() {

        // when
        const { hasNew, warnings } = await templatesUpdater.update('8.8');

        // then
        expect(hasNew).to.be.true;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to parse template foo version 1 fetched from https://foo.com/ootb-connectors?id=foo&version=1: Expected property name or \'}\' in JSON at position 2 (line 1 column 3)');

        expect(renderer.send).to.have.been.calledWith('client:templates-update-success',
          true,
          [
            'Failed to parse template foo version 1 fetched from https://foo.com/ootb-connectors?id=foo&version=1: Expected property name or \'}\' in JSON at position 2 (line 1 column 3)'
          ]
        );

        expectConnectorTemplates(userPath, mockTemplates.filter(template => template.id !== 'foo' || template.version !== 1));
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