/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import { Settings } from '../Settings';

const settingsMock = {
  id: 'test',
  title: 'Test',
  properties: {
    'test.enabled': {
      type: 'boolean',
      label: 'Enabled',
      default: true,
    },
    'test.name': {
      type: 'text',
      label: 'Name',
      default: 'test',
    }
  }
};

describe('Settings', function() {

  let settings;

  const configSpy = {
    get: sinon.spy(),
    set: sinon.spy(),
  };

  this.beforeEach(function() {
    settings = new Settings({
      config: configSpy
    });
  });

  describe('schema', function() {

    it('should return the registered schema for all settings', function() {

      // given
      settings.register(settingsMock);

      // when
      const schema = settings.getSchema();

      // then
      const expected = { test: { ...settingsMock } };
      expect(schema).to.deep.equal(expected);
    });


    it('should return the registered schema for specified setting', function() {

      // given
      settings.register(settingsMock);

      // when
      const schema = settings.getSchema('test.enabled');

      // then
      const expected = { ...settingsMock.properties['test.enabled'] };
      expect(schema).to.deep.equal(expected);
    });
  });


  describe('get and set', function() {

    it('should return the default values for all settings', function() {

      // given
      settings.register(settingsMock);

      // when
      const values = settings.get();

      // then
      expect(values).to.deep.equal({
        'test.enabled': true,
        'test.name': 'test'
      });
    });


    it('should return the default value for the specified setting', function() {

      // given
      settings.register(settingsMock);

      // when
      const value = settings.get('test.name');

      // then
      expect(value).to.equal('test');
    });


    it('should return the set value for the specified setting', function() {

      // given
      settings.register(settingsMock);
      settings.set({ 'test.name': 'foo' });

      // when
      const value = settings.get('test.name');

      // then
      expect(value).to.equal('foo');
    });
  });


  describe('subscribe', function() {

    it('should call the listener when the setting is changed', function() {

      // given
      const listener = sinon.spy();

      settings.register(settingsMock);
      settings.subscribe('test.name', listener);

      // when
      settings.set({ 'test.name': 'foo' });

      // then
      expect(listener).to.have.been.calledWith({ 'test.name': 'foo' });
    });

  });
});