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
    const result = getTemplateSourceConfig({ userPath });

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
    { setting: false, flag: true },
    { setting: true, flag: false }
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


  it('should ignore removed caches without deleting them or matching user files', function() {

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
    const before = fs.readdirSync(directory);

    // when
    const removed = configure([ { url: 'https://example.com/a' } ]);
    const cleared = configure([]);
    const readded = configure([ { url: 'https://example.com/a' }, { url: 'https://example.com/b#fragment' } ]);

    // then
    expect(removed.ignoredPaths).to.eql([ cachePaths[2] ]);
    expect(cleared.ignoredPaths).to.have.members(cachePaths.slice(1));
    expect(readded).to.eql(original);
    expect(fs.readdirSync(directory)).to.eql(before);
    cachePaths.forEach(file => expect(fs.readFileSync(file, 'utf8')).to.equal('[{"id":"cached"}]'));
  });


  it('should treat an edited URL as a new source and retain its old cache', function() {

    // given
    const original = configure([ { url: 'https://example.com/old' } ]);
    const oldPath = getTemplatesPath(userPath, original.endpoints[1].fileName);
    fs.mkdirSync(path.dirname(oldPath), { recursive: true });
    fs.writeFileSync(oldPath, '[]');

    // when
    const result = configure([ { url: 'https://example.com/new' } ]);

    // then
    expect(result.ignoredPaths).to.eql([ oldPath ]);
    expect(result.endpoints.map(({ fileName }) => fileName)).not.to.include(original.endpoints[1].fileName);
    expect(fs.readFileSync(oldPath, 'utf8')).to.equal('[]');
  });


  it('should not crash when the cache directory cannot be read', function() {

    // given
    sinon.stub(fs, 'readdirSync').throws(Object.assign(new Error('access denied'), { code: 'EACCES' }));

    // when
    const result = configure([ { url: 'https://example.com/index' } ]);

    // then
    expect(result.endpoints).to.have.length(2);
  });


  function configure(sources) {
    return getTemplateSourceConfig({ userPath, settings: { 'app.customTemplateSources': sources } });
  }
});
