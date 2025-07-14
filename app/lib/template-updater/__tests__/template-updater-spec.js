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

const { TemplateUpdater, OOTB_CONNECTORS_ENDPOINT } = require('../template-updater');

const userPath = path.resolve(__dirname, 'tmp');

const mockTemplates = require('./mock-templates.json');


describe('template-updater - TemplateUpdater', function() {

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


  let templateUpdater;

  beforeEach(function() {
    templateUpdater = new TemplateUpdater(userPath, [ OOTB_CONNECTORS_ENDPOINT ]);
  });


  describe('updating and caching', function() {

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


    it('should update templates (no existing)', async function() {

      // given
      const doneSpy = sinon.spy();

      templateUpdater.on('update:done', doneSpy);

      // when
      await templateUpdater.update('Camunda Cloud', '8.8');

      // then
      expect(doneSpy).to.have.been.calledWith(true, []);

      await expectTemplates(userPath, [
        { ...mockTemplates[0], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=3' } },
        { ...mockTemplates[1], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=2' } },
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
        { ...mockTemplates[3], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=2' } },
        { ...mockTemplates[4], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=1' } }
      ]);
    });


    it('should update templates (no existing, compatible only)', async function() {

      // given
      const doneSpy = sinon.spy();

      templateUpdater.on('update:done', doneSpy);

      // when
      await templateUpdater.update('Camunda Cloud', '8.6');

      // then
      expect(doneSpy).to.have.been.calledWith(true, []);

      await expectTemplates(userPath, [
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
        { ...mockTemplates[4], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=1' } }
      ]);
    });


    it('should update templates (existing, ref unchanged)', async function() {

      // given
      const doneSpy = sinon.spy();

      templateUpdater.on('update:done', doneSpy);

      await createUserData(userPath, [
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
      ]);

      // when
      await templateUpdater.update('Camunda Cloud', '8.8');

      // then
      expect(doneSpy).to.have.been.calledWith(true, []);

      await expectTemplates(userPath, [
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
        { ...mockTemplates[0], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=3' } },
        { ...mockTemplates[1], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=2' } },
        { ...mockTemplates[3], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=2' } },
        { ...mockTemplates[4], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=1' } }
      ]);

      // expect that we don't fetch the template again
      expect(log.find(entry => entry.path === '/ootb-connectors?id=foo&version=1')).not.to.exist;
    });


    it('should update templates (existing, ref changed)', async function() {

      // given
      const doneSpy = sinon.spy();

      templateUpdater.on('update:done', doneSpy);

      await createUserData(userPath, [
        { ...mockTemplates[2], metadata: { upstreamRef: 'foo' } },
      ]);

      // when
      await templateUpdater.update('Camunda Cloud', '8.8');

      // then
      expect(doneSpy).to.have.been.calledWith(true, []);

      await expectTemplates(userPath, [
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
        { ...mockTemplates[0], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=3' } },
        { ...mockTemplates[1], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=2' } },
        { ...mockTemplates[3], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=2' } },
        { ...mockTemplates[4], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=1' } }
      ]);

      // expect that we fetch the template again
      expect(log.find(entry => entry.path === '/ootb-connectors?id=foo&version=1')).to.exist;
    });


    it('should update templates (existing broken)', async function() {

      // given
      const doneSpy = sinon.spy();

      templateUpdater.on('update:done', doneSpy);

      await createUserData(userPath, '[{]');

      // when
      await templateUpdater.update('Camunda Cloud', '8.8');

      // then
      expect(doneSpy).to.have.been.calledWith(true, []);

      await expectTemplates(userPath, [
        { ...mockTemplates[0], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=3' } },
        { ...mockTemplates[1], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=2' } },
        { ...mockTemplates[2], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=foo&version=1' } },
        { ...mockTemplates[3], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=2' } },
        { ...mockTemplates[4], metadata: { upstreamRef: 'https://foo.com/ootb-connectors?id=bar&version=1' } }
      ]);
    });

  });


  describe('error handling', function() {

    describe('marketplace /api/v1/connectors error', function() {

      beforeEach(function() {
        marketPlaceMockPool = mockAgent.get('https://marketplace.cloud.camunda.io');

        marketPlaceMockPool.intercept({ path: '/api/v1/ootb-connectors' }).reply(500);
      });


      it('should not update connector templates', async function() {

        // given
        const doneSpy = sinon.spy();

        templateUpdater.on('update:done', doneSpy);

        // when
        const { hasNew, warnings } = await templateUpdater.update('Camunda Cloud', '8.8');

        // then
        expect(hasNew).to.be.false;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to fetch templates from https://marketplace.cloud.camunda.io/api/v1/ootb-connectors (HTTP 500)');

        expect(doneSpy).to.have.been.calledWith(
          false,
          [
            'Failed to fetch templates from https://marketplace.cloud.camunda.io/api/v1/ootb-connectors (HTTP 500)'
          ]
        );

        expectNoTemplates(userPath);
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

        // given
        const doneSpy = sinon.spy();

        templateUpdater.on('update:done', doneSpy);

        // when
        const { hasNew, warnings } = await templateUpdater.update('Camunda Cloud', '8.8');

        // then
        expect(hasNew).to.be.true;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to fetch template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)');

        expect(doneSpy).to.have.been.calledWith(
          true,
          [
            'Failed to fetch template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)'
          ]
        );

        expectTemplates(userPath, mockTemplates.filter(template => template.id !== 'foo' || template.version !== 1));
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

        // given
        const doneSpy = sinon.spy();

        templateUpdater.on('update:done', doneSpy);

        // when
        const { hasNew, warnings } = await templateUpdater.update('Camunda Cloud', '8.8');

        // then
        expect(hasNew).to.be.true;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.eql('Failed to parse template foo version 1 fetched from https://foo.com/ootb-connectors?id=foo&version=1: Expected property name or \'}\' in JSON at position 2 (line 1 column 3)');

        expect(doneSpy).to.have.been.calledWith(
          true,
          [
            'Failed to parse template foo version 1 fetched from https://foo.com/ootb-connectors?id=foo&version=1: Expected property name or \'}\' in JSON at position 2 (line 1 column 3)'
          ]
        );

        expectTemplates(userPath, mockTemplates.filter(template => template.id !== 'foo' || template.version !== 1));
      });

    });

  });

});

async function createUserData(userPath, templates = []) {
  const templatesDirectoryPath = getTemplatesDirectoryPath(userPath);

  await fs.promises.mkdir(templatesDirectoryPath, { recursive: true });

  const templatesFilePath = getTemplatesFilePath(userPath);

  const stringifiedTemplates = isString(templates) ? templates : JSON.stringify(templates, null, 2);

  await fs.promises.writeFile(templatesFilePath, stringifiedTemplates);
}

function getTemplatesDirectoryPath(userPath) {
  return path.join(userPath, 'resources/element-templates');
}

function getTemplatesFilePath(userPath) {
  return path.join(getTemplatesDirectoryPath(userPath), '.camunda-connector-templates.json');
}

async function expectTemplates(userPath, expectedTemplates) {
  const templatesFilePath = getTemplatesFilePath(userPath);

  expect(fs.existsSync(templatesFilePath)).to.be.true;

  const templates = JSON.parse(await fs.promises.readFile(templatesFilePath, 'utf8'));

  expect(templates).to.have.length(expectedTemplates.length);

  expectedTemplates.forEach((expectedConnectorTemplate, index) => {
    expect(templates[index]).to.eql(expectedConnectorTemplate);
  });
}

async function expectNoTemplates(userPath) {
  const templatesFilePath = getTemplatesFilePath(userPath);

  expect(fs.existsSync(templatesFilePath)).to.be.false;
}
