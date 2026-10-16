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
const os = require('os');
const path = require('path');
const sinon = require('sinon');
const { expect } = require('chai');

const { getTemplateSourceConfig } = require('../sources');
const { OOTB_CONNECTORS_ENDPOINT } = require('../template-updater');
const { getTemplatesPath } = require('../util');


describe('template-updater - sources', function() {

  let userPath;

  beforeEach(function() {
    userPath = fs.mkdtempSync(path.join(os.tmpdir(), 'template-sources-'));
  });

  afterEach(function() {
    sinon.restore();
    fs.rmSync(userPath, { recursive: true, force: true });
  });


  it('should default to OOTB without creating a cache directory', function() {

    // when
    const { cleanupTemplateSourcesCache, ...result } = getTemplateSourceConfig({ userPath });
    cleanupTemplateSourcesCache();

    // then
    expect(result).to.eql({
      endpoints: [ OOTB_CONNECTORS_ENDPOINT ],
      ignoredPaths: []
    });
    expect(fs.readdirSync(userPath)).to.eql([]);
  });


  it('should configure independent sources in order after OOTB', function() {

    // when
    const result = configure([ { url: 'http://internal.example/index' }, { url: 'https://example.com/index?group=1' } ]);

    // then
    expect(result.endpoints.map(({ url }) => url)).to.eql([
      OOTB_CONNECTORS_ENDPOINT.url,
      'http://internal.example/index',
      'https://example.com/index?group=1'
    ]);
    expect(result.endpoints.every(({ executionPlatform }) => executionPlatform === 'Camunda Cloud')).to.be.true;
    expect(result.endpoints[1].fileName).to.match(/^\.custom-element-templates-[0-9a-f]{64}\.json$/);
    expect(result.endpoints[2].fileName).not.to.equal(result.endpoints[1].fileName);
  });


  it('should normalize URLs, retain queries and skip repeated custom URLs', function() {

    // when
    const result = configure([
      ' HTTPS://EXAMPLE.COM:443/a/../index?group=1#first ',
      { url: 'https://example.com/index?group=1#second' },
      { url: 'https://example.com/index?group=2' }
    ]);

    // then
    expect(result.endpoints.slice(1).map(({ url }) => url)).to.eql([
      'https://example.com/index?group=1',
      'https://example.com/index?group=2'
    ]);
    expect(result.endpoints[1].fileName).to.equal(configure([ { url: 'https://example.com/index?group=1' } ]).endpoints[1].fileName);
    expect(result.endpoints[2].fileName).not.to.equal(result.endpoints[1].fileName);
  });


  it('should configure named sources and skip disabled ones', function() {

    // given
    const disabled = { name: 'Disabled', url: 'https://example.com/disabled', enabled: false };

    // when
    const result = configure([
      { name: 'Enabled', url: 'https://example.com/enabled', enabled: true },
      { url: 'https://example.com/implicitly-enabled' },
      disabled,
      { name: 'Duplicate of disabled', url: 'https://example.com/disabled' }
    ]);

    // then
    expect(result.endpoints.slice(1).map(({ url }) => url)).to.eql([
      'https://example.com/enabled',
      'https://example.com/implicitly-enabled',
      'https://example.com/disabled'
    ]);
  });


  it('should ignore the cache of a disabled source', function() {

    // given
    const source = { name: 'Source', url: 'https://example.com/index', enabled: true };
    const { endpoints } = configure([ source ]);
    const cachePath = getTemplatesPath(userPath, endpoints[1].fileName);
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, '[]');

    // when
    const result = configure([ { ...source, enabled: false } ]);
    result.cleanupTemplateSourcesCache();

    // then
    expect(result.endpoints).to.eql([ OOTB_CONNECTORS_ENDPOINT ]);
    expect(result.ignoredPaths).to.eql([ cachePath ]);
    expect(fs.existsSync(cachePath)).to.be.true;
  });


  [ null, {}, 42, 'https://example.com/index', { url: 'https://example.com/index' } ].forEach(value => {
    it(`should ignore a non-array setting (${ JSON.stringify(value) })`, function() {

      // when
      const result = configure(value);

      // then
      expect(result.endpoints).to.eql([ OOTB_CONNECTORS_ENDPOINT ]);
    });
  });


  it('should skip invalid entries without dropping valid ones', function() {

    // when
    const result = configure([
      null, {}, 42, { url: '' }, { url: '  ' }, { url: '/index' }, { url: 'not a URL' }, { name: 'No URL' }, { url: 42 },
      'https://plain.example/index',
      { url: 'file:///tmp/index.json' }, { url: 'ftp://example.com/index' },
      { url: 'https://user@example.com/index' }, { url: 'http://user:secret@example.com/index' },
      { url: 'http://:secret@example.com/index' }, { url: 'https://valid.example/index' }
    ]);

    // then
    expect(result.endpoints.slice(1).map(({ url }) => url)).to.eql([ 'https://valid.example/index' ]);
  });


  [
    { setting: true, flag: undefined },
    { setting: false, flag: true }
  ].forEach(({ setting, flag }) => {
    it(`should disable only OOTB (setting=${ setting }, flag=${ flag })`, function() {

      // given
      const settings = {
        'app.disableConnectorTemplates': setting,
        'app.customTemplateSources': [ { url: 'https://example.com/index' } ]
      };
      const flags = { get: () => flag };

      // when
      const result = getTemplateSourceConfig({ userPath, settings, flags });

      // then
      expect(result.endpoints.map(({ url }) => url)).to.eql([ 'https://example.com/index' ]);
      expect(result.ignoredPaths).to.eql([ getTemplatesPath(userPath, OOTB_CONNECTORS_ENDPOINT.fileName) ]);
    });
  });


  it('should enable OOTB if flag overrides setting', function() {

    // given
    const settings = { 'app.disableConnectorTemplates': true };
    const flags = { get: () => false };

    // when
    const result = getTemplateSourceConfig({ userPath, settings, flags });

    // then
    expect(result.endpoints).to.eql([ OOTB_CONNECTORS_ENDPOINT ]);
    expect(result.ignoredPaths).to.be.empty;
  });


  it('should delete removed caches without matching user files or the OOTB cache', function() {

    // given
    const original = configure([ { url: 'https://example.com/a' }, { url: 'https://example.com/b' } ]);
    const directory = getTemplatesPath(userPath, '');
    fs.mkdirSync(directory, { recursive: true });

    const cachePaths = original.endpoints.map(({ fileName }) => getTemplatesPath(userPath, fileName));

    for (const file of cachePaths) {
      fs.writeFileSync(file, '[{"id":"cached"}]');
    }

    const userFiles = [ 'manual.json', '.custom-element-templates-mine.json', original.endpoints[2].fileName + '.backup.json' ];
    userFiles.forEach(file => fs.writeFileSync(path.join(directory, file), '[]'));

    // when
    const removed = configure([ { url: 'https://example.com/a' } ]);

    // then
    expect(removed.ignoredPaths).to.eql([ cachePaths[2] ]);
    expect(fs.existsSync(cachePaths[2])).to.be.true;

    // when
    removed.cleanupTemplateSourcesCache();

    // then
    expect(fs.existsSync(cachePaths[2])).to.be.false;
    expect(fs.readFileSync(cachePaths[1], 'utf8')).to.equal('[{"id":"cached"}]');

    // when
    const cleared = configure([]);
    cleared.cleanupTemplateSourcesCache();
    const readded = configure([ { url: 'https://example.com/a' }, { url: 'https://example.com/b#fragment' } ]);

    // then
    expect(cleared.ignoredPaths).to.eql([ cachePaths[1] ]);
    expect(readded.endpoints).to.eql(original.endpoints);
    expect(readded.ignoredPaths).to.be.empty;
    expect(fs.readdirSync(directory)).to.have.members([ original.endpoints[0].fileName, ...userFiles ]);
    expect(fs.readFileSync(cachePaths[0], 'utf8')).to.equal('[{"id":"cached"}]');
    userFiles.forEach(file => expect(fs.readFileSync(path.join(directory, file), 'utf8')).to.equal('[]'));
  });


  it('should treat an edited URL as a new source and delete its old cache', function() {

    // given
    const original = configure([ { url: 'https://example.com/old' } ]);
    const oldPath = getTemplatesPath(userPath, original.endpoints[1].fileName);
    fs.mkdirSync(path.dirname(oldPath), { recursive: true });
    fs.writeFileSync(oldPath, '[]');

    // when
    const result = configure([ { url: 'https://example.com/new' } ]);
    result.cleanupTemplateSourcesCache();

    // then
    expect(result.ignoredPaths).to.eql([ oldPath ]);
    expect(result.endpoints.map(({ fileName }) => fileName)).not.to.include(original.endpoints[1].fileName);
    expect(fs.existsSync(oldPath)).to.be.false;
  });


  it('should ignore a removed cache if deletion fails and continue deleting others', function() {

    // given
    const { endpoints } = configure([ { url: 'https://example.com/a' }, { url: 'https://example.com/b' } ]);
    const cachePaths = endpoints.slice(1).map(({ fileName }) => getTemplatesPath(userPath, fileName));
    fs.mkdirSync(path.dirname(cachePaths[0]), { recursive: true });
    cachePaths.forEach(file => fs.writeFileSync(file, '[]'));
    sinon.stub(fs, 'unlinkSync').callThrough()
      .withArgs(cachePaths[0]).throws(Object.assign(new Error('access denied'), { code: 'EACCES' }));

    // when
    const result = configure([]);
    result.cleanupTemplateSourcesCache();

    // then
    expect(result.ignoredPaths).to.have.members(cachePaths);
    expect(fs.existsSync(cachePaths[0])).to.be.true;
    expect(fs.existsSync(cachePaths[1])).to.be.false;
  });


  it('should not crash when the cache directory cannot be read', function() {

    // given
    sinon.stub(fs, 'readdirSync').throws(Object.assign(new Error('access denied'), { code: 'EACCES' }));

    // when
    const result = configure([ { url: 'https://example.com/index' } ]);
    result.cleanupTemplateSourcesCache();

    // then
    expect(result.endpoints).to.have.length(2);
  });


  function configure(sources) {
    return getTemplateSourceConfig({ userPath, settings: { 'app.customTemplateSources': sources } });
  }
});
