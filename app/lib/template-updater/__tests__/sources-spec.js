/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const sinon = require('sinon');
const { expect } = require('chai');

const { resolveTemplateSources } = require('../sources');
const { OOTB_CONNECTORS_ENDPOINT } = require('../template-updater');


describe('template-updater - sources', function() {

  afterEach(function() {
    sinon.restore();
  });


  it('should default to OOTB connectors', function() {

    // when
    const result = resolveTemplateSources({});

    // then
    expect(result).to.eql({
      sources: [ { ...OOTB_CONNECTORS_ENDPOINT, enabled: true } ]
    });
  });


  it('should resolve independent sources in order after OOTB', function() {

    // when
    const result = configure([ { url: 'http://internal.example/index' }, { url: 'https://example.com/index?group=1' } ]);

    // then
    expect(result.sources.map(({ url }) => url)).to.eql([
      OOTB_CONNECTORS_ENDPOINT.url,
      'http://internal.example/index',
      'https://example.com/index?group=1'
    ]);
    expect(result.sources.every(({ executionPlatform }) => executionPlatform === 'Camunda Cloud')).to.be.true;
    expect(result.sources.every(({ enabled }) => enabled)).to.be.true;
    expect(result.sources[1].fileName).to.match(/^\.custom-element-templates-[0-9a-f]{64}\.json$/);
    expect(result.sources[2].fileName).not.to.equal(result.sources[1].fileName);
  });


  it('should normalize URLs, retain queries and skip repeated custom URLs', function() {

    // when
    const result = configure([
      ' HTTPS://EXAMPLE.COM:443/a/../index?group=1#first ',
      { url: 'https://example.com/index?group=1#second' },
      { url: 'https://example.com/index?group=2' }
    ]);

    // then
    expect(result.sources.slice(1).map(({ url }) => url)).to.eql([
      'https://example.com/index?group=1',
      'https://example.com/index?group=2'
    ]);
    expect(result.sources[1].fileName).to.equal(configure([ { url: 'https://example.com/index?group=1' } ]).sources[1].fileName);
    expect(result.sources[2].fileName).not.to.equal(result.sources[1].fileName);
  });


  it('should resolve named sources and mark disabled ones', function() {

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
    expect(result.sources.slice(1).map(({ url, enabled }) => [ url, enabled ])).to.eql([
      [ 'https://example.com/enabled', true ],
      [ 'https://example.com/implicitly-enabled', true ],
      [ 'https://example.com/disabled', false ]
    ]);
  });


  it('should keep the identity of a disabled source', function() {

    // given
    const source = { name: 'Source', url: 'https://example.com/index', enabled: true };
    const { sources: enabled } = configure([ source ]);

    // when
    const { sources: disabled } = configure([ { ...source, enabled: false } ]);

    // then the cache file is stable, so disabling and re-enabling reuses it
    expect(disabled[1].fileName).to.eql(enabled[1].fileName);
    expect(disabled[1].enabled).to.be.false;
  });


  [ null, {}, 42, 'https://example.com/index', { url: 'https://example.com/index' } ].forEach(value => {
    it(`should ignore a non-array setting (${ JSON.stringify(value) })`, function() {

      // when
      const result = configure(value);

      // then
      expect(result.sources).to.have.length(1);
    });
  });


  it('should skip invalid entries without dropping valid ones', function() {

    // when
    const result = configure([
      null, {}, 42, { url: '' }, { url: '  ' }, { url: '/index' }, { url: 'not a URL' }, { name: 'No URL' }, { url: 42 },
      'https://plain.example/index',
      { url: 'file:///tmp/index.json' }, { url: 'ftp://example.com/index' },
      { url: 'https://user@example.com/index' }, { url: '******example.com/index' },
      { url: 'http://:secret@example.com/index' }, { url: 'https://valid.example/index' }
    ]);

    // then
    expect(result.sources.slice(1).map(({ url }) => url)).to.eql([ 'https://valid.example/index' ]);
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
      const result = resolveTemplateSources({ settings, flags });

      // then
      expect(result.sources.map(({ url, enabled }) => [ url, enabled ])).to.eql([
        [ OOTB_CONNECTORS_ENDPOINT.url, false ],
        [ 'https://example.com/index', true ]
      ]);
    });
  });


  it('should enable OOTB if flag overrides setting', function() {

    // given
    const settings = { 'app.disableConnectorTemplates': true };
    const flags = { get: () => false };

    // when
    const result = resolveTemplateSources({ settings, flags });

    // then
    expect(result.sources).to.have.length(1);
    expect(result.sources[0].enabled).to.be.true;
  });


  function configure(sources) {
    return resolveTemplateSources({ settings: { 'app.customTemplateSources': sources } });
  }
});
