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
      const mockPlugins = {
        foo: {
          name: 'foo',
          script: 'bar',
          style: 'baz'
        },
        bar: {
          name: 'bar',
          script: 'foo',
          style: 'baz'
        }
      };

      const plugins = new Plugins({
        plugins: {
          getAll() {
            return mockPlugins;
          }
        }
      });

      // when
      await plugins.loadAll();

      // then
      const calls = headStub.getCalls();

      expect(calls).to.have.lengthOf(4);

      const args = calls.reduce((args, call) => [ ...args, ...call.args ], []);

      expect(args.filter(({ tagName }) => tagName === 'LINK')).to.have.lengthOf(2);
      expect(args.filter(({ tagName }) => tagName === 'SCRIPT')).to.have.lengthOf(2);
    });

  });


  describe('#get', function() {

    afterEach(function() {
      delete window.plugins;
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

    afterEach(function() {
      delete window.getPluginsDirectory;
      delete window.getModelerDirectory;
    });


    it('should expose plugins protocol for window#getPluginsDirectory', function() {
      // given
      const plugins = new Plugins();

      plugins.bindGlobalHelpers();

      // when
      const directory = window.getPluginsDirectory();

      // then
      expect(directory).to.be.eql('app-plugins://');
    });


    it('should expose plugins protocol for window#getModelerDirectory', function() {
      // given
      const plugins = new Plugins();

      plugins.bindGlobalHelpers();

      // when
      const directory = window.getModelerDirectory();

      // then
      expect(directory).to.be.eql('app-plugins://');
    });

  });

});