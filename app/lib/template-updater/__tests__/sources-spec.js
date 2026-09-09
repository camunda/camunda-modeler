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
      templateSourcePaths: [ getTemplatesPath(userPath, OOTB_CONNECTORS_ENDPOINT.fileName) ],
      ignoredPaths: []
    });
    expect(fs.readdirSync(userPath)).to.eql([]);
  });


  it('should configure independent sources in order after OOTB', function() {

    // when
    const result = configure([ 'http://internal.example/index', 'https://example.com/index?group=1' ]);

    // then
    expect(result.endpoints.map(({ url }) => url)).to.eql([
      OOTB_CONNECTORS_ENDPOINT.url,
      'http://internal.example/index',
      'https://example.com/index?group=1'
    ]);
    expect(result.endpoints.every(({ executionPlatform }) => executionPlatform === 'Camunda Cloud')).to.be.true;
    expect(result.endpoints[1].fileName).to.match(/^\.custom-element-templates-[0-9a-f]{64}\.json$/);
    expect(result.endpoints[2].fileName).not.to.equal(result.endpoints[1].fileName);
    expect(result.templateSourcePaths).to.eql(result.endpoints.map(({ fileName }) => getTemplatesPath(userPath, fileName)));
  });


  it('should normalize URLs, retain queries and skip repeated custom URLs', function() {

    // when
    const result = configure([
      ' HTTPS://EXAMPLE.COM:443/a/../index?group=1#first ',
      'https://example.com/index?group=1#second',
      'https://example.com/index?group=2'
    ]);

    // then
    expect(result.endpoints.slice(1).map(({ url }) => url)).to.eql([
      'https://example.com/index?group=1',
      'https://example.com/index?group=2'
    ]);
    expect(result.endpoints[1].fileName).to.equal(configure([ 'https://example.com/index?group=1' ]).endpoints[1].fileName);
    expect(result.endpoints[2].fileName).not.to.equal(result.endpoints[1].fileName);
  });


  [ null, {}, 42, 'https://example.com/index' ].forEach(value => {
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
      null, {}, 42, '', '  ', '/index', 'not a URL',
      'file:///tmp/index.json', 'ftp://example.com/index',
      'https://user@example.com/index', 'http://user:secret@example.com/index',
      'http://:secret@example.com/index', 'https://valid.example/index'
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
        'app.customTemplateSources': [ 'https://example.com/index' ]
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
    const original = configure([ 'https://example.com/a', 'https://example.com/b' ]);
    const directory = getTemplatesPath(userPath, '');
    fs.mkdirSync(directory, { recursive: true });

    for (const file of original.templateSourcePaths) {
      fs.writeFileSync(file, '[{"id":"cached"}]');
    }

    const userFiles = [ 'manual.json', '.custom-element-templates-mine.json', original.endpoints[2].fileName + '.backup.json' ];
    userFiles.forEach(file => fs.writeFileSync(path.join(directory, file), '[]'));
    const before = fs.readdirSync(directory);

    // when
    const removed = configure([ 'https://example.com/a' ]);
    const cleared = configure([]);
    const readded = configure([ 'https://example.com/a', 'https://example.com/b#fragment' ]);

    // then
    expect(removed.ignoredPaths).to.eql([ original.templateSourcePaths[2] ]);
    expect(cleared.ignoredPaths).to.have.members(original.templateSourcePaths.slice(1));
    expect(readded).to.eql(original);
    expect(fs.readdirSync(directory)).to.eql(before);
    original.templateSourcePaths.forEach(file => expect(fs.readFileSync(file, 'utf8')).to.equal('[{"id":"cached"}]'));
  });


  it('should treat an edited URL as a new source and retain its old cache', function() {

    // given
    const original = configure([ 'https://example.com/old' ]);
    const oldPath = original.templateSourcePaths[1];
    fs.mkdirSync(path.dirname(oldPath), { recursive: true });
    fs.writeFileSync(oldPath, '[]');

    // when
    const result = configure([ 'https://example.com/new' ]);

    // then
    expect(result.ignoredPaths).to.eql([ oldPath ]);
    expect(result.templateSourcePaths).not.to.include(oldPath);
    expect(fs.readFileSync(oldPath, 'utf8')).to.equal('[]');
  });


  it('should not crash when the cache directory cannot be read', function() {

    // given
    sinon.stub(fs, 'readdirSync').throws(Object.assign(new Error('access denied'), { code: 'EACCES' }));

    // when
    const result = configure([ 'https://example.com/index' ]);

    // then
    expect(result.endpoints).to.have.length(2);
  });


  function configure(sources) {
    return getTemplateSourceConfig({ userPath, settings: { 'app.customTemplateSources': sources } });
  }
});
