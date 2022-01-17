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

import Flags, { DISABLE_DMN, DISABLE_ZEEBE, DISABLE_PLATFORM, DISABLE_CMMN } from '../../util/Flags';

import {
  ENGINE_PROFILES,
  ENGINES
} from '../../util/Engines';

import Metadata from '../../util/Metadata';


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


  it('should provide BPMN, DMN, FORM and empty tab without flags', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.getProvider('bpmn')).to.exist;
    expect(tabsProvider.getProvider('dmn')).to.exist;
    expect(tabsProvider.getProvider('form')).to.exist;

    expect(tabsProvider.getProvider('empty')).to.exist;
  });


  it('should not provide CMMN tab without flags', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.hasProvider('cmmn')).to.be.false;
  });


  it('should export BPMN, CMMN and DMN as JPEG, PNG and SVG', function() {

    // given
    Flags.init({
      [DISABLE_CMMN]: false
    });

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
    expect(tabsProvider.getProvider('bpmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('cmmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('dmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('form').exports).to.eql({});
  });


  describe('should provide initial tab contents', function() {

    function verifyExists(name) {

      return it(name, function() {

        // given
        Flags.init({
          [DISABLE_CMMN]: false
        });

        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab(name);

        // then
        expect(contents).to.exist;

        // without the {{ ID }} and {{ CAMUNDA_* }} placeholders
        expect(contents).not.to.contain('{{ ');
      });
    }

    verifyExists('bpmn');

    verifyExists('cloud-bpmn');

    verifyExists('cmmn');

    verifyExists('dmn');

    verifyExists('form');

    verifyExists('cloud-form');


    it('for an empty file of known type', function() {

      // given
      const tabsProvider = new TabsProvider();
      const file = {
        name: 'diagram.bpmn',
        path: '/a/diagram.bpmn'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.type).to.eql('bpmn');
      expect(tab.file.contents).to.exist;
      expect(tab.file.contents).to.have.lengthOf.above(0);
    });


    it('should replace version placeholder with actual latest version', function() {

      // given
      const tabsProvider = new TabsProvider();

      const latestCloudVersion = ENGINE_PROFILES.find(
        p => p.executionPlatform === ENGINES.CLOUD
      ).executionPlatformVersions[0];

      // when
      const { file: { contents } } = tabsProvider.createTab('cloud-bpmn');

      // then
      expect(contents).to.include(`modeler:executionPlatformVersion="${ latestCloudVersion }"`);
    });


    describe('replacing exporter placeholder with actual exporter', function() {

      it('bpmn', function() {

        // given
        const tabsProvider = new TabsProvider();

        const {
          name,
          version
        } = Metadata;

        // when
        const { file: { contents } } = tabsProvider.createTab('bpmn');

        // then
        expect(contents).to.include(`exporter="${ name }" exporterVersion="${ version }"`);
      });


      it('form', function() {

        // given
        const tabsProvider = new TabsProvider();

        const {
          name,
          version
        } = Metadata;

        // when
        const { file: { contents } } = tabsProvider.createTab('form');

        // then
        expect(JSON.parse(contents).exporter).to.eql({
          name,
          version
        });
      });

    });

  });


  it('should create tabs', function() {

    // given
    Flags.init({
      [DISABLE_CMMN]: false
    });

    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.createTab('bpmn')).to.exist;
    expect(tabsProvider.createTab('cmmn')).to.exist;
    expect(tabsProvider.createTab('dmn')).to.exist;
    expect(tabsProvider.createTab('form')).to.exist;
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
      expect(await tabsProvider.getTabComponent('form')).to.exist;

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


    it('should take cloud-bpmn first for known bpmn file', function() {

      // given
      Flags.init({});

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.xml',
        path: '/a/foo.xml',
        contents: require('./TabsProviderSpec.cloud.bpmn')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('cloud-bpmn');
    });


    it('should use camunda for known bpmn file, if Zeebe is disabled', function() {

      // given
      Flags.init({
        [DISABLE_ZEEBE]: true
      });

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.bpmn',
        path: '/a/foo.bpmn',
        contents: require('./TabsProviderSpec.cloud.bpmn')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab).to.exist;

      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('bpmn');
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


    it('should take form for forms if no engine defined', function() {

      // given
      Flags.init({});

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.form',
        path: '/a/foo.form',
        contents: '{"type": "default"}'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('form');
    });


    it('should take cloud-form for forms with Cloud as defined engine', function() {

      // given
      Flags.init({});

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.form',
        path: '/a/foo.form',
        contents: require('./TabsProviderSpec.cloud.form')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('cloud-form');
    });


    it('should take form for forms with Platform as defined engine', function() {

      // given
      Flags.init({});

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.form',
        path: '/a/foo.form',
        contents: require('./TabsProviderSpec.form')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('form');
    });

  });


  it('#getProviders', function() {

    // given
    Flags.init({
      [DISABLE_CMMN]: false
    });

    const tabsProvider = new TabsProvider();

    // when
    const providers = tabsProvider.getProviders();

    // then
    expect(providers['bpmn']).to.exist;
    expect(providers['cmmn']).to.exist;
    expect(providers['dmn']).to.exist;
    expect(providers['empty']).to.exist;
  });


  describe('#getProviderNames', function() {

    it('should return default provider names', function() {

      // given
      Flags.init({});
      const tabsProvider = new TabsProvider();

      // when
      const providerNames = tabsProvider.getProviderNames();

      // then
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'FORM' ]);

    });


    it('should return all provider names', function() {

      // given
      Flags.init({
        [DISABLE_CMMN]: false
      });
      const tabsProvider = new TabsProvider();

      // when
      const providerNames = tabsProvider.getProviderNames();

      // then
      expect(providerNames).to.eql([ 'BPMN', 'CMMN', 'DMN', 'FORM' ]);

    });


    it('should return cloud provider names only', function() {

      // given
      Flags.init({
        [DISABLE_PLATFORM]: true
      });
      const tabsProvider = new TabsProvider();

      // when
      const providerNames = tabsProvider.getProviderNames();

      // then
      expect(providerNames).to.eql([ 'BPMN', 'FORM' ]);

    });


    it('should return platform provider names only', function() {

      // given
      Flags.init({
        [DISABLE_ZEEBE]: true
      });
      const tabsProvider = new TabsProvider();

      // when
      const providerNames = tabsProvider.getProviderNames();

      // then
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'FORM' ]);

    });

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


  describe('#getLinter', function() {

    [
      'bpmn',
      'cmmn',
      'dmn'
    ].forEach((type) => {

      it(type, function() {

        // given
        Flags.init({
          [DISABLE_CMMN]: false
        });

        const tabsProvider = new TabsProvider().getProvider(type);

        // when
        const linter = tabsProvider.getLinter();

        // then
        expect(linter).to.be.null;
      });

    });


    it('cloud-bpmn', function() {

      // given
      const tabsProvider = new TabsProvider().getProvider('cloud-bpmn');

      // when
      const linter = tabsProvider.getLinter();

      // then
      expect(linter).to.exist;
    });


    it('form', function() {

      // given
      const tabsProvider = new TabsProvider().getProvider('form');

      // when
      const linter = tabsProvider.getLinter();

      // then
      expect(linter).to.exist;
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


    it('should enable CMMN', function() {

      // given
      Flags.init({
        [DISABLE_CMMN]: false
      });

      // when
      const tabsProvider = new TabsProvider();

      // then
      expect(tabsProvider.hasProvider('cmmn')).to.be.true;
    });

  });


  describe('#getTabIcon', function() {

    let tabsProvider;

    beforeEach(function() {
      Flags.init({
        [DISABLE_CMMN]: false
      });

      tabsProvider = new TabsProvider();
    });

    [
      'bpmn',
      'cloud-bpmn',
      'dmn',
      'form',
      'cloud-form'
    ].forEach((type) => {

      it(`should have icon <${type}>`, function() {

        // when
        const icon = tabsProvider.getTabIcon(type);

        // then
        expect(icon).to.exist;
      });

    });


    it('should NOT have icon', function() {

      // when
      const icon = tabsProvider.getTabIcon('cmmn');

      // then
      expect(icon).to.not.exist;
    });

  });

});
