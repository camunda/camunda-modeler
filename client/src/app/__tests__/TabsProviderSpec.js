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

import Flags, {
  DISABLE_DMN,
  DISABLE_ZEEBE,
  DISABLE_PLATFORM,
  CLOUD_ENGINE_VERSION,
  PLATFORM_ENGINE_VERSION,
  DISABLE_HTTL_HINT,
  DEFAULT_HTTL,
  DISABLE_RPA
} from '../../util/Flags';

import {
  getLatestStable as getLatestStablePlatformVersion,
  ENGINES
} from '../../util/Engines';

import Metadata from '../../util/Metadata';


describe('TabsProvider', function() {

  afterEach(Flags.reset);


  it('should default to noop provider', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const provider = tabsProvider.getProvider('unknown');

    // then
    expect(provider.getComponent()).to.be.null;
    expect(provider.getInitialContents()).to.be.null;
  });


  it('should be pluggable', function() {

    // given
    const tabsProvider = new TabsProvider([ {
      coolTab: {
        canOpen(file) {
          return true;
        },
        getComponent() {
          return 'MyComponent';
        },
        getInitialContents() {
          return 'initial contents';
        },
        getIcon() {
          return null;
        }
      },
    } ]);

    // when
    const provider = tabsProvider.getProvider('coolTab');

    // then
    expect(provider.getComponent()).to.eql('MyComponent');
    expect(provider.getInitialContents()).to.eql('initial contents');
  });


  it('should provide BPMN, DMN, FORM and empty tab without flags', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.getProvider('bpmn')).to.exist;
    expect(tabsProvider.getProvider('cloud-bpmn')).to.exist;
    expect(tabsProvider.getProvider('dmn')).to.exist;
    expect(tabsProvider.getProvider('cloud-dmn')).to.exist;
    expect(tabsProvider.getProvider('form')).to.exist;

    expect(tabsProvider.getProvider('empty')).to.exist;
  });


  it('should export BPMN and DMN as JPEG, PNG and SVG', function() {

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
    expect(tabsProvider.getProvider('bpmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('cloud-bpmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('dmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('cloud-dmn').exports).to.eql(expected);
    expect(tabsProvider.getProvider('form').exports).to.eql({});
  });


  describe('should provide initial tab contents', function() {

    function verifyExists(name) {

      return it(name, function() {

        // given
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

    verifyExists('dmn');

    verifyExists('cloud-dmn');

    verifyExists('form');

    verifyExists('cloud-form');


    it('for an empty file of known type (BPMN)', function() {

      // given
      const tabsProvider = new TabsProvider();
      const file = {
        name: 'diagram.bpmn',
        path: '/a/diagram.bpmn'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.type).to.eql('cloud-bpmn');
      expect(tab.file.contents).to.exist;
      expect(tab.file.contents).to.have.lengthOf.above(0);
    });


    it('for an empty file of known type (DMN)', function() {

      // given
      const tabsProvider = new TabsProvider();
      const file = {
        name: 'diagram.dmn',
        path: '/a/diagram.dmn'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.type).to.eql('cloud-dmn');
      expect(tab.file.contents).to.exist;
      expect(tab.file.contents).to.have.lengthOf.above(0);
    });


    it('should replace version placeholder with actual latest version (BPMN)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.PLATFORM);

      // when
      const { file: { contents } } = tabsProvider.createTab('bpmn');

      // then
      expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
    });


    it('should replace version placeholder with actual latest version (Cloud BPMN)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

      // when
      const { file: { contents } } = tabsProvider.createTab('cloud-bpmn');

      // then
      expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
    });


    it('should replace version placeholder with actual latest version (DMN)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.PLATFORM);

      // when
      const { file: { contents } } = tabsProvider.createTab('dmn');

      // then
      expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
    });


    it('should replace version placeholder with actual latest version (Cloud DMN)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

      // when
      const { file: { contents } } = tabsProvider.createTab('cloud-dmn');

      // then
      expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
    });


    describe('engine version flag support', function() {

      it('should replace version placeholder with version from flag (BPMN)', function() {

        // given
        Flags.init({
          [PLATFORM_ENGINE_VERSION]: '7.18.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('bpmn');

        // then
        expect(contents).to.include('modeler:executionPlatformVersion="7.18.0"');
      });


      it('should replace version placeholder with version from flag (Cloud BPMN)', function() {

        // given
        Flags.init({
          [CLOUD_ENGINE_VERSION]: '8.0.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('cloud-bpmn');

        // then
        expect(contents).to.include('modeler:executionPlatformVersion="8.0.0"');
      });


      it('should replace version placeholder with version from flag (DMN)', function() {

        // given
        Flags.init({
          [PLATFORM_ENGINE_VERSION]: '7.18.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('dmn');

        // then
        expect(contents).to.include('modeler:executionPlatformVersion="7.18.0"');
      });


      it('should replace version placeholder with version from flag (Cloud DMN)', function() {

        // given
        Flags.init({
          [CLOUD_ENGINE_VERSION]: '8.0.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('cloud-dmn');

        // then
        expect(contents).to.include('modeler:executionPlatformVersion="8.0.0"');
      });


      it('should replace version placeholder with version from flag (FORM)', function() {

        // given
        Flags.init({
          [PLATFORM_ENGINE_VERSION]: '7.18.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('form');

        // then
        expect(contents).to.include('"executionPlatformVersion": "7.18.0"');
      });


      it('should replace version placeholder with version from flag (Cloud FORM)', function() {

        // given
        Flags.init({
          [CLOUD_ENGINE_VERSION]: '8.0.0'
        });
        const tabsProvider = new TabsProvider();

        // when
        const { file: { contents } } = tabsProvider.createTab('cloud-form');

        // then
        expect(contents).to.include('"executionPlatformVersion": "8.0.0"');
      });


      describe('invalid flag', function() {

        beforeEach(function() {
          Flags.init({
            [PLATFORM_ENGINE_VERSION]: 'abc',
            [CLOUD_ENGINE_VERSION]: 'cde'
          });
        });


        it('should replace version placeholder with actual latest version (BPMN)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.PLATFORM);

          // when
          const { file: { contents } } = tabsProvider.createTab('bpmn');

          // then
          expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (Cloud BPMN)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

          // when
          const { file: { contents } } = tabsProvider.createTab('cloud-bpmn');

          // then
          expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (DMN)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.PLATFORM);

          // when
          const { file: { contents } } = tabsProvider.createTab('dmn');

          // then
          expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (Cloud DMN)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

          // when
          const { file: { contents } } = tabsProvider.createTab('cloud-dmn');

          // then
          expect(contents).to.include(`modeler:executionPlatformVersion="${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (FORM)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.PLATFORM);

          // when
          const { file: { contents } } = tabsProvider.createTab('form');

          // then
          expect(contents).to.include(`"executionPlatformVersion": "${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (Cloud FORM)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

          // when
          const { file: { contents } } = tabsProvider.createTab('cloud-form');

          // then
          expect(contents).to.include(`"executionPlatformVersion": "${ expectedPlatformVersion }"`);
        });


        it('should replace version placeholder with actual latest version (RPA)', function() {

          // given
          const tabsProvider = new TabsProvider();

          const expectedPlatformVersion = getLatestStablePlatformVersion(ENGINES.CLOUD);

          // when
          const { file: { contents } } = tabsProvider.createTab('rpa');

          // then
          expect(contents).to.include(`"executionPlatformVersion": "${ expectedPlatformVersion }"`);
        });
      });
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


      it('dmn', function() {

        // given
        const tabsProvider = new TabsProvider();

        const {
          name,
          version
        } = Metadata;

        // when
        const { file: { contents } } = tabsProvider.createTab('dmn');

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
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.createTab('bpmn')).to.exist;
    expect(tabsProvider.createTab('cloud-bpmn')).to.exist;
    expect(tabsProvider.createTab('dmn')).to.exist;
    expect(tabsProvider.createTab('cloud-dmn')).to.exist;
    expect(tabsProvider.createTab('form')).to.exist;
    expect(tabsProvider.createTab('rpa')).to.exist;
  });


  // TODO(nikku): test fails on Windows
  (process.env.WINDOWS ? it.skip : it)('should provide tab component',
    async function() {

      // given
      const tabsProvider = new TabsProvider();

      // then
      expect(await tabsProvider.getTabComponent('bpmn')).to.exist;
      expect(await tabsProvider.getTabComponent('cloud-bpmn')).to.exist;
      expect(await tabsProvider.getTabComponent('dmn')).to.exist;
      expect(await tabsProvider.getTabComponent('cloud-dmn')).to.exist;
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
      expect(tab.type).to.eql('cloud-bpmn');
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
      expect(tab.type).to.eql('cloud-bpmn');
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


    it('should create for file of recognized contents (DMN 1.3)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.xml',
        path: '/a/foo.xml',
        contents: require('./TabsProviderSpec.dmn13.xml')
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


    it('should take cloud-dmn first for known dmn file', function() {

      // given
      Flags.init({});

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.xml',
        path: '/a/foo.xml',
        contents: require('./TabsProviderSpec.cloud.dmn')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('cloud-dmn');
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


    it('should use camunda for known dmn file, if Zeebe is disabled', function() {

      // given
      Flags.init({
        [DISABLE_ZEEBE]: true
      });

      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.dmn',
        path: '/a/foo.dmn',
        contents: require('./TabsProviderSpec.cloud.dmn')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab).to.exist;

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
    const tabsProvider = new TabsProvider();

    // when
    const providers = tabsProvider.getProviders();

    // then
    expect(providers['bpmn']).to.exist;
    expect(providers['cloud-bpmn']).to.exist;
    expect(providers['dmn']).to.exist;
    expect(providers['cloud-dmn']).to.exist;
    expect(providers['rpa']).to.exist;
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
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'Form', 'RPA' ]);

    });


    it('should return all provider names', function() {

      // given
      const tabsProvider = new TabsProvider();

      // when
      const providerNames = tabsProvider.getProviderNames();

      // then
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'Form', 'RPA' ]);

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
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'Form', 'RPA' ]);

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
      expect(providerNames).to.eql([ 'BPMN', 'DMN', 'Form' ]);

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
      'dmn'
    ].forEach((type) => {

      it(type, async function() {

        // given
        const tabsProvider = new TabsProvider().getProvider(type);

        // when
        const linter = await tabsProvider.getLinter();

        // then
        expect(linter).to.be.null;
      });

    });


    [
      'bpmn',
      'cloud-bpmn',
      'form'
    ].forEach((type) => {

      it(type, async function() {

        // given
        const tabsProvider = new TabsProvider().getProvider(type);

        // when
        const linter = await tabsProvider.getLinter(
          [],
          { },
          () => {}
        );

        // then
        expect(linter).to.exist;
      });

    });


    it('cloud-bpmn should configure element template plugin', async function() {

      // given
      const tabsProvider = new TabsProvider().getProvider('cloud-bpmn');
      const templates = [
        {
          '$schema': 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
          'name': 'empty',
          'id': 'constraints.empty',
          'appliesTo': [
            'bpmn:Task'
          ],
          'properties': []
        }
      ];
      const getConfig = () => templates ;

      const tabMock = { file: 'foo' };

      // when
      const linter = await tabsProvider.getLinter(
        [],
        tabMock,
        getConfig
      );

      // then
      const plugins = linter.getPlugins();

      expect(linter).to.exist;
      expect(plugins).to.have.length(1);

      const rules = plugins[0].config.rules;
      expect(rules['element-templates/validate']).to.exist;
      expect(rules['element-templates/validate'][1].templates).to.eql(templates);
    });


    it('cloud-bpmn plugins', async function() {

      // given
      const plugin = {
        config: {},
        resolver: {
          resolveConfig() {},
          resolveRule() {}
        }
      };

      const tabsProvider = new TabsProvider().getProvider('cloud-bpmn');

      // when
      const linter = await tabsProvider.getLinter(
        [ plugin ],
        {},
        () => {}
      );

      // then
      expect(linter).to.exist;
      expect(linter.getPlugins()).to.have.length(2);
    });


    it('bpmn plugins', async function() {

      // given
      const plugin = {
        config: {},
        resolver: {
          resolveConfig() {},
          resolveRule() {}
        }
      };

      const tabsProvider = new TabsProvider().getProvider('bpmn');

      // when
      const linter = await tabsProvider.getLinter([ plugin ]);

      // then
      expect(linter).to.exist;
      expect(linter.getPlugins()).to.have.length(1);
    });

  });


  describe('flags', function() {

    it('should disable DMN', function() {

      // given
      Flags.init({
        [DISABLE_DMN]: true
      });

      // when
      const tabsProvider = new TabsProvider();

      // then
      expect(tabsProvider.hasProvider('dmn')).to.be.false;
      expect(tabsProvider.hasProvider('cloud-dmn')).to.be.false;
    });


    it('should disable RPA', function() {

      // given
      Flags.init({
        [DISABLE_RPA]: true
      });

      // when
      const tabsProvider = new TabsProvider();

      // then
      expect(tabsProvider.hasProvider('rpa')).to.be.false;
    });


    it('should disable HTTL hint', async function() {

      // given
      const tabsProvider = new TabsProvider().getProvider('bpmn');

      // when
      const defaultLinter = await tabsProvider.getLinter([]);

      // then
      expect(defaultLinter).to.exist;
      expect(defaultLinter.getPlugins()).to.be.empty;

      // but when
      Flags.init({
        [DISABLE_HTTL_HINT]: true
      });

      // when
      const customLinter = await tabsProvider.getLinter([]);

      // then
      expect(customLinter).to.exist;
      expect(customLinter.getPlugins()).to.have.length(1);
    });


    it('should return default history ttl', function() {

      // given
      Flags.init({});
      const tabsProvider = new TabsProvider();

      // when
      const { file: { contents } } = tabsProvider.createTab('bpmn');

      // then
      expect(contents).to.not.include('historyTimeToLive');

    });


    it('should replace history ttl placeholder with version from flag (BPMN)', function() {

      // given
      Flags.init({
        [DEFAULT_HTTL]: '30'
      });
      const tabsProvider = new TabsProvider();

      // when
      const { file: { contents } } = tabsProvider.createTab('bpmn');

      // then
      expect(contents).to.include('historyTimeToLive="30"');
    });

  });


  describe('#getTabIcon', function() {

    let tabsProvider;

    beforeEach(function() {
      tabsProvider = new TabsProvider();
    });

    [
      'bpmn',
      'cloud-bpmn',
      'dmn',
      'cloud-dmn',
      'form',
      'cloud-form',
      'rpa'
    ].forEach((type) => {

      it(`should have icon <${type}>`, function() {

        // when
        const icon = tabsProvider.getTabIcon(type);

        // then
        expect(icon).to.exist;
      });

    });

  });

});
