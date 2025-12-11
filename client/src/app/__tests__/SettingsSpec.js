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

import Settings from '../Settings';
import { Flags } from '../../util';


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
    },
    'test.flag': {
      type: 'boolean',
      label: 'Flag',
      default: false,
      flag: 'test-flag'
    },
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

  describe('register', function() {

    it('should register and return values', function() {

      // when
      const values = settings.register(settingsMock);

      // then
      expect(values).to.deep.equal({
        'test.enabled': true,
        'test.name': 'test',
        'test.flag': false
      });
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


    it('should register description when provided', function() {

      // given
      const settingsWithDescription = {
        ...settingsMock,
        description: 'Test description'
      };

      // when
      settings.register(settingsWithDescription);
      const schema = settings.getSchema();

      // then
      expect(schema[settingsMock.id].description).to.equal('Test description');
    });


    it('should add new properties to an existing group', function() {

      // given
      settings.register(settingsMock);

      // when
      const newProperty = {
        'test.new': {
          type: 'text',
          label: 'New',
          default: 'new'
        }
      };

      settings.register({ ...settingsMock, properties: {
        ...newProperty
      } });

      const schema = settings.getSchema();

      // then
      const expected = { ...settingsMock.properties, ...newProperty };
      expect(schema[settingsMock.id].properties).to.deep.equal(expected);
    });


    it('should throw error when duplicate group is registered', function() {

      // given
      settings.register(settingsMock);

      // then
      expect(() => {
        settings.register(settingsMock);
      }).to.throw();
    });


    it('should throw error when property ID does not start with group ID', function() {

      // given
      settings.register(settingsMock);

      // then
      expect(() => {
        settings.register({ ...settingsMock, id: 'another' });
      }).to.throw();
    });


    it('should throw error when group has no ID', function() {

      // given
      const group = {
        title: 'Test',
        properties: {}
      };

      // then
      expect(() => {
        settings.register(group);
      }).to.throw();
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
        'test.name': 'test',
        'test.flag': false
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


    it('should return value set by a flag', function() {

      // given
      Flags.init({
        'test-flag': true
      });
      settings.register(settingsMock);

      // when
      const value = settings.get('test.flag');

      // then
      expect(value).to.equal(true);
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


    it('should throw when key does not exist', function() {

      // given
      const key = 'test.invalid';

      // when
      settings.register(settingsMock);

      // then
      const get = () => settings.get(key);

      // expect error to contain the invalid key
      expect(get).to.throw(key);
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
      expect(listener).to.have.been.calledWith({ value: 'foo' });
    });


    it('should call the listener when the setting is registered', function() {

      // given
      const listener = sinon.spy();
      settings.subscribe('test.name', listener);

      // when
      settings.register(settingsMock);

      // then
      expect(listener).to.have.been.calledWith({ value: 'test' });
    });

  });
});
