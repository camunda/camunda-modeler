/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { render, waitFor } from '@testing-library/react';

import { isString } from 'min-dash';

import AppParent from '../AppParent';
import Settings from '../Settings';
import Config from '../../remote/Config';
import { TabsProvider } from '../';
import { migrateConnections } from '../migrations/migrateConnections';
import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings';

import {
  Backend,
  Dialog,
  FileSystem,
  Plugins,
  Workspace,
  Deployment,
  StartInstance,
  SystemClipboard,
  ZeebeAPI
} from './mocks';


/**
 * TestSettings - extends real Settings, overrides I/O methods for in-memory testing.
 *
 * Inherits all logic (register, get, set, subscribe, etc.) from the real Settings class.
 * Only overrides _load() and _save() to prevent file I/O.
 */
class TestSettings extends Settings {

  constructor(initialValues = {}) {

    // Pass a mock configProvider that does nothing
    super({
      config: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve()
      }
    });

    // Set initial test values
    this._values = { ...initialValues };
  }

  // Override _load() - no-op instead of reading from file
  async _load() {
    this._notifyAll();
  }

  // Override _save() - no-op instead of writing to file
  _save() {

    // Keep values in memory only
  }
}


/**
 * TestConfig - extends real Config, overrides I/O methods for in-memory testing.
 *
 * Inherits all helper methods (getForFile, setForFile, getForPlugin, setForPlugin)
 * from the real Config class. Only overrides get() and set() to prevent IPC calls.
 */
class TestConfig extends Config {

  constructor(initialValues = {}) {

    // Pass a no-op backend to parent
    super({ send: () => Promise.resolve() });

    // In-memory storage
    this._values = { ...initialValues };
  }

  // Override get() - use in-memory storage instead of IPC
  get(key) {
    return Promise.resolve(this._values[key]);
  }

  // Override set() - use in-memory storage instead of IPC
  set(key, value) {
    if (!isString(key)) {
      return Promise.reject(new Error('key must be string'));
    }

    this._values[key] = value;
    return Promise.resolve();
  }
}


/**
 * Log class - no-op for tests
 */
class Log {
  error() {}
}


describe('migrateConnections', function() {

  describe('Scenario 1: Fresh Install', function() {

    it('should create default endpoint when no settings or legacy config exist', async function() {

      // given
      const { settings, backend } = createAppParent({
        initialSettingsValues: {},
        initialConfigValues: {}
      });

      // when
      backend.receive('client:started');

      // then
      await waitFor(() => {
        const connections = settings.get(SETTINGS_KEY_CONNECTIONS);
        expect(connections).to.have.lengthOf(1);
        expect(connections[0].name).to.equal('c8run (local)');
        expect(connections[0].contactPoint).to.equal('http://localhost:8080/v2');
      });
    });

  });


  describe('Scenario 2: Already Migrated', function() {

    it('should not modify settings when c8connections already exists', async function() {

      // given
      const existingConnections = [
        { id: 'existing-1', name: 'My Existing Connection' }
      ];

      const { settings, backend } = createAppParent({
        initialSettingsValues: {
          [SETTINGS_KEY_CONNECTIONS]: existingConnections
        },
        initialConfigValues: {
          'zeebeEndpoints': [ { id: 'legacy', name: 'Should Be Ignored' } ]
        }
      });

      // when
      backend.receive('client:started');

      // then
      await waitFor(() => {
        const connections = settings.get(SETTINGS_KEY_CONNECTIONS);
        expect(connections).to.deep.equal(existingConnections);
      });
    });

  });


  describe('Scenario 3: Legacy Migration', function() {

    it('should migrate legacy zeebeEndpoints and add default endpoint', async function() {

      // given
      const legacyEndpoints = [
        { id: 'legacy-1', name: 'Legacy Connection 1' },
        { id: 'legacy-2', name: 'Legacy Connection 2' }
      ];

      const { settings, backend } = createAppParent({
        initialSettingsValues: {},
        initialConfigValues: {
          'zeebeEndpoints': legacyEndpoints
        }
      });

      // when
      backend.receive('client:started');

      // then
      await waitFor(() => {
        const connections = settings.get(SETTINGS_KEY_CONNECTIONS);
        expect(connections).to.have.lengthOf(3);
        expect(connections[0]).to.include({ name: 'Legacy Connection 1' });
        expect(connections[1]).to.include({ name: 'Legacy Connection 2' });
        expect(connections[2].name).to.equal('c8run (local)');
      });
    });

  });


  describe('Scenario 4: Explicitly Deleted Connections', function() {

    it('should not seed default endpoint when connections were explicitly deleted', async function() {

      // given
      const { settings, backend } = createAppParent({
        initialSettingsValues: {
          [SETTINGS_KEY_CONNECTIONS]: []
        },
        initialConfigValues: {}
      });

      // when
      backend.receive('client:started');

      // then
      await waitFor(() => {
        const connections = settings.get(SETTINGS_KEY_CONNECTIONS);
        expect(connections).to.deep.equal([]);
      });
    });

  });

});


// helpers //////////////////////

function createAppParent(options = {}) {
  const {
    initialSettingsValues = {},
    initialConfigValues = {}
  } = options;

  const backend = new Backend();
  const config = new TestConfig(initialConfigValues);
  const settings = new TestSettings(initialSettingsValues);

  const globals = {
    backend,
    config,
    deployment: new Deployment(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    log: new Log(),
    plugins: new Plugins(),
    settings,
    startInstance: new StartInstance(),
    systemClipboard: new SystemClipboard(),
    workspace: new Workspace(),
    zeebeAPI: new ZeebeAPI()
  };

  const onStarted = () => {
    migrateConnections(globals.settings, globals.config);
  };

  const tabsProvider = new TabsProvider();

  const keyboardBindings = {
    bind: () => {},
    unbind: () => {},
    update: () => {},
    setOnAction: () => {}
  };

  const rendered = render(
    <AppParent
      keyboardBindings={ keyboardBindings }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onStarted={ onStarted }
    />
  );

  return {
    ...rendered,
    settings,
    config,
    backend
  };
}
