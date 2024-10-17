/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import Plugins from '../Plugins';


describe('plugins', function() {

  describe('#loadAll', function() {

    let headStub;

    beforeEach(function() {
      headStub = sinon.stub(document.head, 'appendChild')
        .callsFake(({ onload }) => onload && onload());
    });


    afterEach(function() {
      headStub && headStub.restore();
    });


    it('should load all plugins', async function() {

      // given
      const plugins = new Plugins([
        {
          name: 'foo',
          script: 'bar',
          style: 'baz'
        },
        {
          name: 'bar',
          script: 'foo',
          style: 'baz'
        }
      ]);

      // when
      await plugins.loadAll();

      // then
      const calls = headStub.getCalls();

      expect(calls).to.have.lengthOf(4);

      const args = calls.reduce((args, call) => [ ...args, ...call.args ], []);

      expect(args.filter(({ tagName }) => tagName === 'LINK')).to.have.lengthOf(2);
      expect(args.filter(({ tagName }) => tagName === 'SCRIPT')).to.have.lengthOf(2);
    });


    it('should attach plugin name to script dataset', async function() {

      // given
      const descriptors = [
        {
          name: 'foo',
          script: 'bar'
        },
        {
          name: 'bar',
          script: 'foo'
        }
      ];
      const plugins = new Plugins(descriptors);

      // when
      await plugins.loadAll();

      // then
      const calls = headStub.getCalls();

      expect(calls).to.have.lengthOf(2);

      const scriptElements = calls.reduce((args, call) => [ ...args, ...call.args ], []);

      scriptElements.forEach((scriptElement, index) => {
        expect(scriptElement.dataset.name).to.eql(descriptors[index].name);
      });
    });

  });


  describe('#get', function() {

    afterEach(function() {
      delete window.plugins;
    });


    it('should always return an array', function() {

      // given
      const plugins = new Plugins();

      // when
      const registeredPlugins = plugins.get('type');

      // then
      expect(registeredPlugins).to.be.an('Array').and.have.lengthOf(0);
    });


    it('should get registered plugin', function() {

      // given
      const mockPlugin = {};
      const mockType = 'foo';

      window.plugins = [
        {
          type: mockType,
          plugin: mockPlugin
        }
      ];

      const plugins = new Plugins();

      // when
      const registeredPlugins = plugins.get(mockType);

      // then
      expect(registeredPlugins).to.be.an('Array').and.have.lengthOf(1);
      expect(registeredPlugins[0]).to.be.eql(mockPlugin);
    });

  });


  describe('global bindings', function() {

    it('should expose plugins protocol for window#getPluginsDirectory', function() {

      // given
      const global = {};

      const plugins = new Plugins();

      plugins.bindHelpers(global);

      // when
      const directory = global.getPluginsDirectory();

      // then
      expect(directory).to.be.eql('app-plugins://');
    });


    it('should expose plugins protocol for window#getModelerDirectory', function() {

      // given
      const global = {};

      const plugins = new Plugins();

      // when
      plugins.bindHelpers(global);

      // then
      expect(() => {
        global.getModelerDirectory();
      }).to.throw('not implemented in Camunda Modeler >= 3');

    });


    it('should expose properties panel building blocks via window#vendor.propertiesPanel.common',
      function() {

        // given
        const global = {};

        const plugins = new Plugins();

        // when
        plugins.bindHelpers(global);

        // then
        expect(global.vendor.propertiesPanel.common).to.exist;
        expect(global.vendor.propertiesPanel.common).to.have.property('PropertiesPanel');
        expect(global.vendor.propertiesPanel.common).to.have.property('Group');
        expect(global.vendor.propertiesPanel.common).to.have.property('ListGroup');
        expect(global.vendor.propertiesPanel.common).to.have.property('TextFieldEntry');
      }
    );


    it('should expose UI components via window#components', function() {

      // given
      const global = {};

      const plugins = new Plugins();

      // when
      plugins.bindHelpers(global);

      // then
      expect(global.components).to.exist;
      expect(global.components).to.have.property('Fill');
      expect(global.components).to.have.property('Modal');
      expect(global.components).to.have.property('Overlay');
      expect(global.components).to.have.property('Section');
      expect(global.components).to.have.property('TextInput');
      expect(global.components).to.have.property('ToggleSwitch');
      expect(global.components).to.have.property('CachedComponent');
      expect(global.components).to.have.property('WithCache');
      expect(global.components).to.have.property('WithCachedState');
      expect(global.components).to.have.property('createTab');
    });


    it('should expose properties panel preact with subpackages via window#vendor.propertiesPanel.preact[...]',
      function() {

        // given
        const global = {};

        const plugins = new Plugins();

        // when
        plugins.bindHelpers(global);

        // then
        expect(global.vendor.propertiesPanel.preact).to.exist;
        expect(global.vendor.propertiesPanel.preact.root).to.exist;
        expect(global.vendor.propertiesPanel.preact.compat).to.exist;
        expect(global.vendor.propertiesPanel.preact.compat.default).to.exist;
        expect(global.vendor.propertiesPanel.preact.hooks).to.exist;
        expect(global.vendor.propertiesPanel.preact.jsxRuntime).to.exist;
      }
    );


    it('should expose BPMN properties panel building blocks via window#vendor.propertiesPanel.bpmn',
      function() {

        // given
        const global = {};

        const plugins = new Plugins();

        // when
        plugins.bindHelpers(global);

        // then
        expect(global.vendor.propertiesPanel.bpmn).to.exist;
        expect(global.vendor.propertiesPanel.bpmn).to.have.property('useService');
      }
    );


    it('should expose DMN properties panel building blocks via window#vendor.propertiesPanel.dmn',
      function() {

        // given
        const global = {};

        const plugins = new Plugins();

        // when
        plugins.bindHelpers(global);

        // then
        expect(global.vendor.propertiesPanel.dmn).to.exist;
        expect(global.vendor.propertiesPanel.dmn).to.have.property('useService');
      }
    );
  });

});
