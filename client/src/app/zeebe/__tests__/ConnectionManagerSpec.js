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

import ConnectionManager from '../ConnectionManager';

describe('ConnectionManager', function() {
  describe('#getEndpoints', function() {

    it('should return empty array when settings returns null', function() {

      // given
      const settings = {
        get: sinon.stub().returns(null)
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns undefined', function() {

      // given
      const settings = {
        get: sinon.stub().returns(undefined)
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns non-array value', function() {

      // given
      const settings = {
        get: sinon.stub().returns('invalid string')
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns object', function() {

      // given
      const settings = {
        get: sinon.stub().returns({ corrupted: 'object' })
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should filter out connections without id', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          name: 'Valid Connection 1',
          url: 'http://localhost:8080'
        },
        {
          name: 'Connection without ID',
          url: 'http://localhost:8081'
        },
        {
          id: '',
          name: 'Connection with empty ID',
          url: 'http://localhost:8082'
        },
        {
          id: 'connection-2',
          name: 'Valid Connection 2',
          url: 'http://localhost:8083'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.have.length(2);
      expect(endpoints[0]).to.have.property('id', 'connection-1');
      expect(endpoints[1]).to.have.property('id', 'connection-2');
    });


    it('should return valid connections array from settings', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          name: 'Test Connection 1',
          url: 'http://localhost:8080'
        },
        {
          id: 'connection-2',
          name: 'Test Connection 2',
          url: 'http://localhost:8081'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createConnectionManager({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal(connections);
    });

  });


  describe('#getConnectionForTab', function() {

    it('should return NO_CONNECTION without tab', async function() {

      // given
      const connectionManager = createConnectionManager();

      // when
      const result = await connectionManager.getConnectionForTab();

      // then
      expect(result.id).to.equal('NO_CONNECTION');
    });


    it('should return NO_CONNECTION without tab.file', async function() {

      // given
      const connectionManager = createConnectionManager();

      // when
      const result = await connectionManager.getConnectionForTab({ file: undefined });

      // then
      expect(result.id).to.equal('NO_CONNECTION');
    });
  });
});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}


class MockConfig extends Mock {
  get(key, defaultValue) {
    return {};
  }

  set(key, value) {
    return undefined;
  }

  getForFile(file, key, defaultValue) {
    return {};
  }

  setForFile(file, value) {
    return undefined;
  }
}

class MockTabStorage extends Mock {
  constructor() {
    super();
    this._storage = new Map();
  }

  get(tab, key, defaultValue = null) {
    const tabData = this._storage.get(tab.id);
    if (!tabData) {
      return defaultValue;
    }
    const value = tabData[key];
    return value !== undefined ? value : defaultValue;
  }

  set(tab, key, value) {
    const tabId = tab.id;
    if (!this._storage.has(tabId)) {
      this._storage.set(tabId, {});
    }
    const tabData = this._storage.get(tabId);
    tabData[key] = value;
  }

  getAll(tab) {
    return this._storage.get(tab.id) || {};
  }

  removeTab(tabId) {
    this._storage.delete(tabId);
  }

  clear() {
    this._storage.clear();
  }
}

function createConnectionManager(options = {}) {
  const {
    tabStorage = new MockTabStorage(),
    config = new MockConfig(),
    settings = { get: () => [] }
  } = options;

  return new ConnectionManager(tabStorage, config, settings);
}
