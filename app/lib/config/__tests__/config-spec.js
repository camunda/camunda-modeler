/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const Config = require('..');

const fs = require('fs');
const path = require('path');


describe('Config', function() {

  describe('default', function() {

    let file;

    beforeEach(function() {
      file = fs.readFileSync(getAbsolutePath('fixtures/config.json'), { encoding: 'utf8' });
    });

    afterEach(function() {
      fs.writeFileSync(getAbsolutePath('fixtures/config.json'), file, { encoding: 'utf8' });
    });


    describe('#get', function() {

      it('should get', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('foo');

        // then
        expect(value).to.equal(42);
      });


      it('should get all', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get();

        // then
        expect(value).to.eql({
          foo: 42
        });
      });


      it('should return null', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('bar');

        // then
        expect(value).to.eql(null);
      });


      it('should return default value', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('bar', 42);

        // then
        expect(value).to.eql(42);
      });

    });


    describe('#set', function() {

      it('should set', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        config.set('foo', false);

        // then
        const value = config.get('foo');

        expect(value).to.equal(false);
      });

    });

  });

  describe('<bpmn.elementTemplates>', function() {

    it('should get', function() {

      // given
      const file = {
        path: getAbsolutePath('fixtures/project/bar.bpmn')
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo'
      });

      // when
      const templates = config.get('bpmn.elementTemplates', file);

      // then
      expect(templates).to.eql([
        { id: 'com.foo.Bar' }, // local
        { id: 'com.foo.Bar', FOO: 'BAR' }, // global
        { id: 'single', FOO: 'BAR' } // global
      ]);
    });


    it('should NOT throw if new file', function() {

      // given
      const file = {
        path: null
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo'
      });

      // when
      const templates = config.get('bpmn.elementTemplates', file);

      // then
      expect(templates).to.eql([
        { id: 'com.foo.Bar', FOO: 'BAR' },
        { id: 'single', FOO: 'BAR' }
      ]);
    });


    it('should throw if JSON#parse errors', function() {

      // given
      const file = null;

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/broken')
        ],
        userPath: 'foo'
      });

      // when
      expect(() => config.get('bpmn.elementTemplates', file))
        .to.throw(/template .* parse error: Unexpected token I.*/);
    });

  });

});


// helpers ///////////////////

function getAbsolutePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}
