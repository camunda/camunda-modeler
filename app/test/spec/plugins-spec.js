'use strict';

const Plugins = require('../../lib/plugins');


describe('Plugins', function() {

  it('should instantiate with empty path', function() {
    new Plugins();
    new Plugins({});
  });


  it('should scan plug-in files', function() {

    // when
    const plugins = new Plugins({
      paths: [
        __dirname + '/../fixtures'
      ]
    });

    // then
    const registeredPlugins = plugins.getPlugins();

    expect(Object.keys(registeredPlugins)).to.eql([
      'broken-menu',
      'OK'
    ]);
  });

});