/* global sinon */

import Plugins from '../Plugins';

const stub = sinon.stub;

const noop = () => {};


describe('Plugins', function() {

  let plugins;

  beforeEach(function() {
    delete window.plugins;

    plugins = new Plugins({
      plugins: {
        getAll() {
          return {
            foo: {
              name: 'foo',
              script: 'foo.js'
            },
            bar: {
              name: 'bar',
              script: 'bar.js'
            },
            baz: {
              name: 'baz',
              style: 'baz.css'
            }
          };
        }
      }
    });

    stub(plugins, '_loadStylePlugin').callsFake(noop);
    stub(plugins, '_loadScriptPlugin').callsFake(({ name }) => {
      if (!window.plugins) {
        window.plugins = [];
      }

      window.plugins.push({
        type: name,
        plugin: {
          __init__: [ name ],
          [ name ]: [ 'type', noop ]
        }
      });

      Promise.resolve();
    });
  });

  afterEach(function() {
    delete window.plugins;
  });


  it('should load plugins', async function() {

    // when
    await plugins.loadAll();

    // then
    expect(plugins._getAll()).to.eql([{
      type: 'foo',
      plugin: {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      }
    }, {
      type: 'bar',
      plugin: {
        __init__: [ 'bar' ],
        bar: [ 'type', noop ]
      }
    }]);
  });


  it('should get loaded plugins (type=foo)', async function() {

    // given
    await plugins.loadAll();

    // then
    expect(plugins.get('foo')).to.eql([{
      __init__: [ 'foo' ],
      foo: [ 'type', noop ]
    }]);
  });

});