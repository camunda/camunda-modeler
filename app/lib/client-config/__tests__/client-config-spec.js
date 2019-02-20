/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ClientConfig = require('..');

const path = require('path');


describe('ClientConfig', function() {

  describe('<bpmn.elementTemplates>', function() {

    it('should provide', function(done) {

      // given
      var fakeDiagram = {
        path: absPath('fixtures/project/bar.bpmn')
      };

      const clientConfig = new ClientConfig({
        paths: [
          absPath('fixtures/ok')
        ]
      });

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
      const fakeDiagram = null;

      const clientConfig = new ClientConfig({
        paths: [
          absPath('fixtures/broken')
        ]
      });

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


// helpers ///////////////////

function absPath(file) {
  return path.resolve(__dirname, file);
}