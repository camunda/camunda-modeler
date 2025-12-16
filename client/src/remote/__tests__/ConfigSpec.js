/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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