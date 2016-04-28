'use strict';

var ClientConfig = require('../../lib/client-config');


describe('ClientConfig', function() {

  var clientConfig;

  beforeEach(function() {
    var app = {
      getPath: function(type) {
        return '';
      }
    };

    clientConfig = new ClientConfig(app);
  });


  it('should provide configuration with load', function() {

    // when
    var cfg = clientConfig.load();

    // then
    expect(cfg).to.have.keys([
      'bpmn.elementTemplates'
    ]);
  });

});