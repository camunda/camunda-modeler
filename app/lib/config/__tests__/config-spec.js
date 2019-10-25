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

const sinon = require('sinon');

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


  describe('<editor.id>', function() {

    it('should get if file exists', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(uuid).to.be.eql('51e50852-53b3-462a-801b-40e98d7c32fd');
    });


    it('should get consistent values', function() {

      // given
      const absolutePath = getAbsolutePath('fixtures/ok/uuid/');

      let uuids = [];

      // when
      for (let i = 0; i < 2; i ++) {
        let config = new Config({
          userPath: absolutePath
        });

        config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

        uuids.push(config.get('editor.id'));
      }

      // then
      expect(isValidUUID(uuids[0])).to.be.true;
      expect(isValidUUID(uuids[1])).to.be.true;
      expect(uuids[0]).to.be.eql(uuids[1]);
    });


    it('should get if file does not exist', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(isValidUUID(uuid)).to.be.true;
    });


    it('should get if uuid malformed inside file', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/broken/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(isValidUUID(uuid)).to.be.true;
    });


    it('should store new id', function() {

      // given
      const saveIDSpy = sinon.spy();
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id'], saveIDSpy);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(saveIDSpy).to.have.been.calledOnceWith(uuid);
    });


    it('should cache', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      config.get('editor.id');

      // then
      expect(config._providers['editor.id']._cachedUUID).to.be.eql('51e50852-53b3-462a-801b-40e98d7c32fd');
    });


    it('should not store if cached', function() {

      // given
      const saveIDSpy = sinon.spy();
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id'], saveIDSpy);

      // when
      config.get('editor.id');
      config.get('editor.id');

      // then
      expect(saveIDSpy).to.have.been.calledOnce;
    });
  });
});


// helpers ///////////////////

function getAbsolutePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function isValidUUID(testedUUID) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !!testedUUID.match(uuidPattern);
}

function mockUUIDStorageFunction(uuidProvider, saveIDSpy) {
  uuidProvider.generateUUIDAndStore = () => {
    var uuid = uuidProvider.generateUUID();
    if (saveIDSpy) {
      saveIDSpy(uuid);
    }
    return uuid;
  };
  return uuidProvider;
}
