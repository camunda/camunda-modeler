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

    it('should get', async function() {

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
      const configForFile = await config.getForFile(file, 'foo');

      // then
      expect(configForFile).to.equal(42);
    });


    it('should return null if no files config at all', async function() {

      // given
      const file = {
        path: 'bar.bpmn'
      };

      backend.setSendResponse(null);

      // when
      const configForFile = await config.getForFile(file, 'foo');

      // then
      expect(configForFile).to.equal(null);
    });


    it('should return null if no config for file', async function() {

      // given
      const file = {
        path: 'bar.bpmn'
      };

      backend.setSendResponse({
        'foo.bpmn': {
          foo: 42
        }
      });

      // when
      const configForFile = await config.getForFile(file, 'foo');

      // then
      expect(configForFile).to.equal(null);
    });


    it('should return null if no value or default value', async function() {

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
      const configForFile = await config.getForFile(file, 'bar');

      // then
      expect(configForFile).to.equal(null);
    });


    it('should return default value if no value', async function() {

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
      const configForFile = await config.getForFile(file, 'bar', 43);

      // then
      expect(configForFile).to.equal(43);
    });


    it('should return null if config does not exist yet', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse(null);

      // when
      const configForFile = await config.getForFile(file, 'bar');

      // then
      expect(configForFile).to.equal(null);
    });

  });


  describe('#setForFile', function() {

    it('should set', async function() {

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
      const configForFile = await config.setForFile(file, 'foo', 43);

      // then
      expect(configForFile).to.eql({
        foo: 43
      });
    });


    it('should set, files config not present', async function() {

      // given
      const file = {
        path: 'foo.bpmn'
      };

      backend.setSendResponse(null);

      // when
      const configForFile = await config.setForFile(file, 'foo', 43);

      // then
      expect(configForFile).to.eql({
        foo: 43
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


    it('should return null if no plugins config at all', async function() {

      // given
      backend.setSendResponse(null);

      // when
      const configForPlugin = await config.getForPlugin('fooPlugin', 'foo');

      // then
      expect(configForPlugin).to.equal(null);
    });


    it('should return null if no config for plugin', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {
          foo: 42
        }
      });

      // when
      const configForPlugin = await config.getForPlugin('barPlugin', 'foo');

      // then
      expect(configForPlugin).to.equal(null);
    });


    it('should return null if no value or default value', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {
          foo: 42
        }
      });

      // when
      const configForFile = await config.getForPlugin('fooPlugin', 'bar');

      // then
      expect(configForFile).to.equal(null);
    });


    it('should return default value if no value', async function() {

      // given
      backend.setSendResponse({
        fooPlugin: {
          foo: 42
        }
      });

      // when
      const configForFile = await config.getForPlugin('fooPlugin', 'bar', 43);

      // then
      expect(configForFile).to.equal(43);
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
      const configForPlugin = await config.setForPlugin('fooPlugin', 'foo', 43);

      // then
      expect(configForPlugin).to.eql({
        foo: 43
      });
    });


    it('should set, plugins config not present', async function() {

      // given
      backend.setSendResponse(null);

      // when
      const configForPlugin = await config.setForPlugin('fooPlugin', 'foo', 43);

      // then
      expect(configForPlugin).to.eql({
        foo: 43
      });
    });

  });

});