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
const { getTemplateSourceConfig } = require('../sources');
const Config = require('../../config');

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


  describe('custom sources', function() {

    const origin = 'http://127.0.0.1:8123';
    const sourceA = require('./fixtures/custom-sources/source-a.json');
    const sourceB = require('./fixtures/custom-sources/source-b.json');
    const templateA1 = require('./fixtures/custom-sources/template-a-v1.json');
    const templateA2 = require('./fixtures/custom-sources/template-a-v2.json');
    const templateB2 = require('./fixtures/custom-sources/template-b-v2.json');

    let pool;

    beforeEach(function() {
      pool = mockAgent.get(origin);
    });


    it('should fetch isolated caches and resolve remote conflicts through Config', async function() {

      // given
      const { updater, config, templateSourcePaths } = configureSources();
      mockSourceA();
      mockSourceB();

      // when
      const result = await updater.update('Camunda Cloud', '8.8');
      const templates = config.get('bpmn.elementTemplates');

      // then
      expect(result).to.eql({ hasNew: true, warnings: [] });
      expect(templates.map(({ name }) => name)).to.have.members([ templateA1.name, templateB2.name ]);
      expect(readCache(templateSourcePaths[0]).map(({ name }) => name)).to.have.members([ templateA1.name, templateA2.name ]);
      expect(readCache(templateSourcePaths[1]).map(({ name }) => name)).to.eql([ templateB2.name ]);
    });


    it('should discover a first-fetched override through the already-used Config', async function() {

      // given
      const { updater, config, endpoints } = configureSources();
      expect(config.get('bpmn.elementTemplates')).to.eql([]);
      mockSourceA();
      await new TemplateUpdater(userPath, [ endpoints[0] ]).update('Camunda Cloud', '8.8');
      const earlier = config.get('bpmn.elementTemplates');
      expect(earlier.map(({ name }) => name)).to.have.members([ templateA1.name, templateA2.name ]);
      pool.intercept({ path: '/source-a.json' }).reply(200, sourceA);
      mockSourceB();
      const done = sinon.spy();
      updater.on('update:done', done);

      // when
      await updater.update('Camunda Cloud', '8.8');
      const current = config.get('bpmn.elementTemplates');

      // then
      expect(done).to.have.been.calledWith(true, []);
      expect(current.map(({ name }) => name)).to.have.members([ templateA1.name, templateB2.name ]);
      expect(earlier.map(({ name }) => name)).to.have.members([ templateA1.name, templateA2.name ]);
    });


    it('should retain but stop loading a removed cache and reuse it when re-added', async function() {

      // given
      const { updater, templateSourcePaths } = configureSources();
      mockSourceA();
      mockSourceB();
      await updater.update('Camunda Cloud', '8.8');
      const cachedB = fs.readFileSync(templateSourcePaths[1], 'utf8');

      // when
      const removed = configureSources([ 'source-a.json' ]);
      const templates = removed.config.get('bpmn.elementTemplates');
      const readded = configureSources();
      const cleared = configureSources([]);

      // then
      expect(removed.endpoints).to.have.length(1);
      expect(templates.map(({ name }) => name)).to.have.members([ templateA1.name, templateA2.name ]);
      expect(fs.readFileSync(templateSourcePaths[1], 'utf8')).to.equal(cachedB);
      expect(readded.config.get('bpmn.elementTemplates').map(({ name }) => name)).to.have.members([ templateA1.name, templateB2.name ]);
      expect(cleared.config.get('bpmn.elementTemplates')).to.eql([]);
    });


    [ { status: 503, body: 'Unavailable' }, { status: 200, body: 'Invalid JSON' } ].forEach(({ status, body }) => {
      it(`should continue after a source failure (${ status })`, async function() {

        // given
        const { updater, config } = configureSources();
        pool.intercept({ path: '/source-a.json' }).reply(status, body);
        mockSourceB();

        // when
        const result = await updater.update('Camunda Cloud', '8.8');

        // then
        expect(result.hasNew).to.be.true;
        expect(result.warnings).to.have.length(1);
        expect(result.warnings[0]).to.include(`${ origin }/source-a.json`);
        expect(config.get('bpmn.elementTemplates').map(({ name }) => name)).to.eql([ templateB2.name ]);
      });
    });


    it('should preserve a failed later source cache and unchanged-reference caching', async function() {

      // given
      const { updater, config, templateSourcePaths } = configureSources();
      mockSourceA();
      mockSourceB();
      await updater.update('Camunda Cloud', '8.8');
      config.get('bpmn.elementTemplates');
      const before = templateSourcePaths.map(file => fs.readFileSync(file, 'utf8'));
      pool.intercept({ path: '/source-a.json' }).reply(200, sourceA);
      pool.intercept({ path: '/source-b.json' }).reply(503, 'Unavailable');
      log.length = 0;

      // when
      const result = await updater.update('Camunda Cloud', '8.8');

      // then
      expect(result.hasNew).to.be.false;
      expect(result.warnings).to.have.length(1);
      expect(log).to.have.length(2);
      expect(config.get('bpmn.elementTemplates').map(({ name }) => name)).to.have.members([ templateA1.name, templateB2.name ]);
      expect(templateSourcePaths.map(file => fs.readFileSync(file, 'utf8'))).to.eql(before);
    });


    it('should fetch only compatible custom versions', async function() {

      // given
      const { updater, config } = configureSources();
      pool.intercept({ path: '/source-a.json' }).reply(200, sourceA);
      pool.intercept({ path: '/source-b.json' }).reply(200, sourceB);
      pool.intercept({ path: '/template-a-v1.json' }).reply(200, templateA1);

      // when
      const result = await updater.update('Camunda Cloud', '8.6');

      // then
      expect(result).to.eql({ hasNew: true, warnings: [] });
      expect(config.get('bpmn.elementTemplates').map(({ name }) => name)).to.eql([ templateA1.name ]);
      expect(log).to.have.length(3);
    });


    it('should not fetch custom sources for Camunda 7', async function() {

      // given
      const { updater } = configureSources();

      // when
      const result = await updater.update('Camunda Platform', '7.24');

      // then
      expect(result).to.eql({ hasNew: false, warnings: [] });
      expect(log).to.eql([]);
    });


    function configureSources(sources = [ 'source-a.json', 'source-b.json' ]) {
      const sourceConfig = getTemplateSourceConfig({
        userPath,
        settings: {
          'app.disableConnectorTemplates': true,
          'app.customTemplateSources': sources.map(source => `${ origin }/${ source }`)
        }
      });

      return {
        ...sourceConfig,
        updater: new TemplateUpdater(userPath, sourceConfig.endpoints),
        config: new Config({ userPath, resourcesPaths: [ path.join(userPath, 'resources') ], ...sourceConfig })
      };
    }

    function mockSourceA() {
      pool.intercept({ path: '/source-a.json' }).reply(200, sourceA);
      pool.intercept({ path: '/template-a-v1.json' }).reply(200, templateA1);
      pool.intercept({ path: '/template-a-v2.json' }).reply(200, templateA2);
    }

    function mockSourceB() {
      pool.intercept({ path: '/source-b.json' }).reply(200, sourceB);
      pool.intercept({ path: '/template-b-v2.json' }).reply(200, templateB2);
    }

    function readCache(file) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
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
        expect(warnings[0]).to.eql('Failed to fetch or parse template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)');

        expect(doneSpy).to.have.been.calledWith(
          true,
          [
            'Failed to fetch or parse template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (HTTP 404)'
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
        expect(warnings[0]).to.eql('Failed to fetch or parse template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (Expected property name or \'}\' in JSON at position 2 (line 1 column 3))');

        expect(doneSpy).to.have.been.calledWith(
          true,
          [
            'Failed to fetch or parse template foo version 1 from https://foo.com/ootb-connectors?id=foo&version=1 (Expected property name or \'}\' in JSON at position 2 (line 1 column 3))'
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
