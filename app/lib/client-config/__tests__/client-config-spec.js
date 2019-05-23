/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const ClientConfig = require('..');

const path = require('path');


describe('ClientConfig', function() {

  describe('<bpmn.elementTemplates>', function() {

    it('should provide', function(done) {

      // given
      var fakeDiagram = {
        file: {
          path: absPath('fixtures/project/bar.bpmn')
        }
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


    it('should not throw for a new file', function(done) {

      // given
      var fakeDiagram = {
        file: {
          path: null
        }
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
