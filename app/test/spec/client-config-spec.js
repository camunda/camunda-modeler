'use strict';

var ClientConfig = require('../../lib/client-config');

var path = require('path');


describe('ClientConfig', function() {

  describe('<bpmn.elementTemplates>', function() {

    var clientConfig;

    var GLOBAL_SEARCH_PATH = '';

    beforeEach(function() {
      var app = {
        getPath: function(type) {
          if (type === 'userData') {
            return GLOBAL_SEARCH_PATH;
          } else {
            return path.resolve('/non/existing');
          }
        }
      };

      clientConfig = new ClientConfig(app);
    });


    it('should provide', function(done) {

      // given
      var fakeDiagram = {
        path: path.join(__dirname, '/../fixtures/element-templates/foo/bar.bpmn')
      };

      GLOBAL_SEARCH_PATH = path.join(__dirname, '/../fixtures/element-templates');

      // when
      clientConfig.get('bpmn.elementTemplates', fakeDiagram, function(err, templates) {

        if (err) {
          return done(err);
        }

        // then
        expect(err).not.to.exist;

        // local templates loaded first
        expect(templates).to.eql([
          { id: 'com.foo.Bar' }, // local (!!!)
          { id: 'com.foo.Bar', FOO: 'BAR' },
          { id: 'single', FOO: 'BAR' }
        ]);

        done();
      });

    });


    it('should propagate JSON parse error', function(done) {

      // given
      var fakeDiagram = null;

      GLOBAL_SEARCH_PATH = path.join(__dirname, '/../fixtures/element-templates/broken');

      // when
      clientConfig.get('bpmn.elementTemplates', fakeDiagram, function(err, templates) {

        // then
        expect(err).to.exist;

        expect(err.message).to.match(/template .* parse error: Unexpected token I.*/);

        done();
      });

    });

  });

});