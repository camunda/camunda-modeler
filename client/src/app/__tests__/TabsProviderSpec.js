/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import TabsProvider from '../TabsProvider';

import Flags, { DISABLE_DMN, DISABLE_CMMN } from '../../util/Flags';


describe('TabsProvider', function() {

  it('should default to noop provider', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const provider = tabsProvider.getProvider('unknown');

    // then
    expect(provider.getComponent()).to.be.null;
    expect(provider.getInitialContents()).to.be.null;
  });


  it('should provide BPMN, CMMN, DMN and empty tab', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.getProvider('bpmn')).to.exist;
    expect(tabsProvider.getProvider('cmmn')).to.exist;
    expect(tabsProvider.getProvider('dmn')).to.exist;

    expect(tabsProvider.getProvider('empty')).to.exist;
  });


  it('should export CMMN and DMN as JPEG, PNG and SVG', function() {

    // given
    const tabsProvider = new TabsProvider();

    const expected = {
      png: {
        name: 'PNG image',
        encoding: 'base64',
        extensions: [ 'png' ]
      },
      jpeg: {
        name: 'JPEG image',
        encoding: 'base64',
        extensions: [ 'jpeg' ]
      },
      svg: {
        name: 'SVG image',
        encoding: 'utf8',
        extensions: [ 'svg' ]
      }
    };

    // then
    expect(tabsProvider.getProvider('cmmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('dmn').exports).to.eql(expected);
  });


  it('should export BPMN as JPEG, PNG, SVG, and QAA/ZIP', function() {

    // given
    const tabsProvider = new TabsProvider();

    const expected = {
      png: {
        name: 'PNG image',
        encoding: 'base64',
        extensions: ['png']
      },
      jpeg: {
        name: 'JPEG image',
        encoding: 'base64',
        extensions: ['jpeg']
      },
      svg: {
        name: 'SVG image',
        encoding: 'utf8',
        extensions: ['svg']
      },
      zip: {
        name: 'Quantum application archive',
        encoding: 'binary',
        extensions: ['zip']
      }
    };

    // then
    expect(tabsProvider.getProvider('bpmn').exports).to.eql(expected);
  });


  describe('should provide initial tab contents', function() {

    function verifyExists(name, opts) {

      return it(name + (opts ? ` ${JSON.stringify(opts)}` : ''), function() {

        // given
        const tabsProvider = new TabsProvider();

        // when
        const contents = tabsProvider.getInitialFileContents(name, opts);

        // then
        expect(contents).to.exist;

        // without the {{ ID }} placeholder
        expect(contents).not.to.contain('{{ ID');
      });
    }

    verifyExists('bpmn');

    verifyExists('cmmn');

    verifyExists('dmn');

  });


  it('should create tabs', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.createTab('bpmn')).to.exist;
    expect(tabsProvider.createTab('cmmn')).to.exist;
    expect(tabsProvider.createTab('dmn')).to.exist;
  });


  // TODO(nikku): test fails on Windows
  (process.env.WINDOWS ? it.skip : it)('should provide tab component',
    async function() {

      // given
      const tabsProvider = new TabsProvider();

      // then
      expect(await tabsProvider.getTabComponent('bpmn')).to.exist;
      expect(await tabsProvider.getTabComponent('cmmn')).to.exist;
      expect(await tabsProvider.getTabComponent('dmn')).to.exist;

      expect(await tabsProvider.getTabComponent('empty')).to.exist;
    }
  );


  describe('create tab for file', function() {

    it('should create for known file (by extension)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.bpmn',
        path: '/a/foo.bpmn'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('bpmn');
    });


    it('should create for known file (by lower case extension)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.BPMN',
        path: '/a/foo.BPMN'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('bpmn');
    });


    it('should create for known file (by contents)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.xml',
        path: '/a/foo.xml',
        contents: require('./TabsProviderSpec.dmn.xml')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('dmn');
    });


    it('should not create for unknown file', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.unknown',
        contents: ''
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab).not.to.exist;
    });

  });


  it('#getProviders', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const providers = tabsProvider.getProviders();

    // then
    expect(providers['bpmn']).to.exist;
    expect(providers['cmmn']).to.exist;
    expect(providers['dmn']).to.exist;
    expect(providers['empty']).to.exist;
  });


  it('#getProviderNames', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const providerNames = tabsProvider.getProviderNames();

    // then
    expect(providerNames).to.eql([ 'BPMN', 'CMMN', 'DMN' ]);
  });


  describe('#hasProvider', function() {

    let tabsProvider;

    beforeEach(function() {
      tabsProvider = new TabsProvider();
    });


    it('should have provider', function() {

      // when
      const hasProvider = tabsProvider.hasProvider('bpmn');

      // then
      expect(hasProvider).to.be.true;
    });

    it('should NOT have provider', function() {

      // when
      const hasProvider = tabsProvider.hasProvider('unknown');

      // then
      expect(hasProvider).to.be.false;
    });

  });


  describe('flags', function() {

    afterEach(Flags.reset);


    it('should disable DMN', function() {

      // given
      Flags.init({
        [DISABLE_DMN]: true
      });

      // when
      const tabsProvider = new TabsProvider();

      // then
      expect(tabsProvider.hasProvider('dmn')).to.be.false;
    });


    it('should disable CMMN', function() {

      // given
      Flags.init({
        [DISABLE_CMMN]: true
      });

      // when
      const tabsProvider = new TabsProvider();

      // then
      expect(tabsProvider.hasProvider('cmmn')).to.be.false;
    });

  });

});
