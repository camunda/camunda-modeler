'use strict';

var ClientConfig = require('../../lib/client-config');


describe('ClientConfig', function() {

  var clientConfig;

  beforeEach(function() {
    clientConfig = new ClientConfig();
  });


  it('should provide configuration with load', function() {

    // when
    var cfg = clientConfig.load();

    // then
    expect(cfg).to.eql({});
  });

});