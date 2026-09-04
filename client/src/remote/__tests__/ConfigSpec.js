/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import Config from '../Config';

import { Backend } from './mocks';


describe('config', function() {

  let backend,
      config;

  beforeEach(function() {
    backend = new Backend();

    config = new Config(backend);
  });


  describe('#getForFile', function() {

    it('should get config value (key provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {
          foo: 42
        }
      });

      // when
      const value = await config.getForFile(file, 'foo');

      // then
      expect(value).to.equal(42);
    });


    it('should get entire config (no key provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {
          foo: 42
        }
      });

      // when
      const value = await config.getForFile(file);

      // then
      expect(value).to.eql({
        foo: 42
      });
    });


    it('should return default value (key provided, no config for file, default value provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({});

      // when
      const value = await config.getForFile(file, 'foo', 42);

      // then
      expect(value).to.equal(42);
    });


    it('should return null (key provided, no config for file, no default value provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({});

      // when
      const value = await config.getForFile(file, 'foo');

      // then
      expect(value).to.equal(null);
    });


    it('should return default value (key provided, no config value, default value provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {}
      });

      // when
      const value = await config.getForFile(file, 'foo', 42);

      // then
      expect(value).to.equal(42);
    });


    it('should return null (key provided, no config value, no default value provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {}
      });

      // when
      const value = await config.getForFile(file, 'foo');

      // then
      expect(value).to.equal(null);
    });


    it('should return null (no config)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse(null);

      // when
      const value = await config.getForFile(file, 'foo');

      // then
      expect(value).to.equal(null);
    });

  });


  describe('#setForFile', function() {

    it('should set config value (key provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {
          foo: 42
        }
      });

      // when
      const value = await config.setForFile(file, 'foo', 43);

      // then
      expect(value).to.eql({
        foo: 43
      });
    });


    it('should set config value (key provided, no config)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse(null);

      // when
      const value = await config.setForFile(file, 'foo', 42);

      // then
      expect(value).to.eql({
        foo: 42
      });
    });


    it('should set entire config (no key provided)', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {
          foo: 42
        }
      });

      // when
      const value = await config.setForFile(file, undefined, { bar: 'baz' });

      // then
      expect(value).to.eql({
        bar: 'baz'
      });
    });

  });


  describe('#updateFiles', function() {

    beforeEach(function() {
      backend = new FilesBackend();

      config = new Config(backend);
    });


    it('should serialize updates', async function() {

      // when
      await Promise.all([
        config.updateFiles(files => ({ ...files, first: true })),
        config.updateFiles(files => ({ ...files, second: true }))
      ]);

      // then
      expect(backend.files).to.eql({
        first: true,
        second: true
      });
    });


    it('should skip write if files did not change', async function() {

      // when
      await config.updateFiles(files => files);

      // then
      expect(backend.writes).to.equal(0);
    });


    it('should continue after failed update', async function() {

      // given
      const failed = config.updateFiles(() => {
        throw new Error('update failed');
      });

      // when
      const update = config.updateFiles(files => ({ ...files, first: true }));

      // then
      expect(await getError(failed)).to.exist;

      await update;

      expect(backend.files).to.eql({ first: true });
    });


    it('should read file config after pending updates', async function() {

      // given
      const update = config.updateFiles(files => ({
        ...files,
        'foo.bpmn': { foo: 42 }
      }));

      // when
      const value = await config.getForFile({ path: 'foo.bpmn' }, 'foo');

      // then
      expect(value).to.equal(42);

      await update;
    });


    it('should reject async updater', async function() {

      // when
      const error = await getError(config.updateFiles(async files => files));

      // then
      expect(error.message).to.equal('updater must be synchronous');
      expect(backend.writes).to.equal(0);
    });

  });


  describe('#getForPlugin', function() {

    it('should get', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {
          foo: 42
        }
      });

      // when
      const configForPlugin = await config.getForPlugin('fooPlugin', 'foo');

      // then
      expect(configForPlugin).to.equal(42);
    });


    it('should return default value (no config for plugin)', async function() {

      // given
      backend.setSendResponse({});

      // when
      const value = await config.getForPlugin('fooPlugin', 'foo', 42);

      // then
      expect(value).to.equal(42);
    });


    it('should return null (no config for plugin, no default value)', async function() {

      // given
      backend.setSendResponse({});

      // when
      const value = await config.getForPlugin('fooPlugin', 'foo');

      // then
      expect(value).to.equal(null);
    });


    it('should return default value (no config value)', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {}
      });

      // when
      const value = await config.getForPlugin('fooPlugin', 'foo', 42);

      // then
      expect(value).to.equal(42);
    });


    it('should return null (no config value, no default value)', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {}
      });

      // when
      const value = await config.getForPlugin('fooPlugin', 'foo');

      // then
      expect(value).to.equal(null);
    });


    it('should return null (no config)', async function() {

      // given
      backend.setSendResponse(null);

      // when
      const configForPlugin = await config.getForPlugin('fooPlugin', 'foo');

      // then
      expect(configForPlugin).to.equal(null);
    });

  });


  describe('#setForPlugin', function() {

    it('should set', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {
          foo: 42
        }
      });

      // when
      const configForPlugin = await config.setForPlugin('fooPlugin', 'foo', 42);

      // then
      expect(configForPlugin).to.eql({
        foo: 42
      });
    });


    it('should set (no config)', async function() {

      // given
      backend.setSendResponse(null);

      // when
      const configForPlugin = await config.setForPlugin('fooPlugin', 'foo', 42);

      // then
      expect(configForPlugin).to.eql({
        foo: 42
      });
    });

  });

});


// helpers //////////

/**
 * Backend that keeps the written configuration, so serialized read/modify/write
 * cycles can be observed.
 */
class FilesBackend {
  constructor() {
    this.files = {};
    this.writes = 0;
  }

  async send(event, key, value) {
    if (event === 'config:get') {
      return key === 'files' ? this.files : null;
    }

    this.files = value;
    this.writes++;
  }
}

async function getError(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
}
