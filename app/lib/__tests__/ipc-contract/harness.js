/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

/**
 * IPC contract test harness.
 *
 * Boots the real `app/lib/index.js` (and, transitively, the real `Workspace`)
 * in an Electron-free environment via proxyquire, replacing only the heavy
 * collaborators that touch disk / network / native windows. A fake `renderer`
 * captures the REAL `renderer.on` / `renderer.onSync` registrations so the
 * contract suite can exercise the actual handler wiring (argument defaulting,
 * `done`-popping, path -> file-url conversion, dialog `defaultPath` mutation,
 * error mapping) rather than re-declaring it.
 *
 * The fake `renderer` is injected `@global` so the real `Workspace` (which is
 * constructed inside `index.js`'s `bootstrap()` and registers
 * `workspace:save` / `workspace:restore`) records into the same registry.
 */

const path = require('path');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const INDEX_PATH = path.resolve(__dirname, '../../index.js');

/**
 * Create a fake `renderer` module that records every registration.
 *
 * @returns {{
 *   on: Function,
 *   onSync: Function,
 *   send: Function,
 *   '@global': boolean,
 *   handlers: Map<string, Function>,
 *   syncHandlers: Map<string, Function>,
 *   sent: Array<Array<any>>
 * }}
 */
function createFakeRenderer() {
  const handlers = new Map();
  const syncHandlers = new Map();
  const sent = [];

  return {
    '@global': true,
    handlers,
    syncHandlers,
    sent,
    on(event, callback) {
      handlers.set(event, callback);
    },
    onSync(event, callback) {
      syncHandlers.set(event, callback);
    },
    send(...args) {
      sent.push(args);
    }
  };
}

/**
 * A minimal EventEmitter-ish stub for the Electron `app` singleton, exposing
 * only the surface `index.js` touches at module-load time.
 */
function createFakeApp() {
  const listeners = new Map();

  const app = {
    name: 'Camunda Modeler',
    version: undefined,
    metadata: undefined,
    plugins: undefined,
    flags: undefined,
    mainWindow: null,
    getName() {
      return 'Camunda Modeler';
    },
    getPath(name) {
      const dir = path.join(require('os').tmpdir(), 'camunda-modeler-ipc-test', name);
      require('fs').mkdirSync(dir, { recursive: true });
      return dir;
    },
    setPath(name, value) {
      require('fs').mkdirSync(value, { recursive: true });
    },
    getVersion() {
      return '0.0.0';
    },
    requestSingleInstanceLock() {
      return true;
    },
    setAsDefaultProtocolClient() {},
    disableHardwareAcceleration() {},
    on(event, cb) {
      const arr = listeners.get(event) || [];
      arr.push(cb);
      listeners.set(event, arr);
      return app;
    },
    once(event, cb) {
      return app.on(event, cb);
    },
    emit(event, ...args) {
      (listeners.get(event) || []).forEach(cb => cb(...args));
    },
    removeAllListeners() {},
    relaunch() {},
    exit() {},
    quit() {},
    focus() {},
    whenReady() {
      return Promise.resolve();
    }
  };

  return app;
}

/**
 * Boot `index.js` with stubbed collaborators and return the captured
 * registration registry plus the doubles, so tests can invoke real handlers.
 */
function bootIndex(overrides = {}) {
  const renderer = createFakeRenderer();
  const app = createFakeApp();

  // Service doubles (sinon stubs) injected into the handlers. Tests configure
  // their return values per case.
  const services = {
    config: { get: sinon.stub(), set: sinon.stub() },
    dialog: {
      showOpenDialog: sinon.stub(),
      showOpenFileErrorDialog: sinon.stub(),
      showSaveDialog: sinon.stub(),
      showDialog: sinon.stub(),
      setActiveWindow: sinon.stub()
    },
    fileContext: {
      addRoot: sinon.stub(),
      removeRoot: sinon.stub(),
      fileOpened: sinon.stub(),
      fileUpdated: sinon.stub(),
      fileClosed: sinon.stub(),
      close: sinon.stub(),
      on: sinon.stub(),
      _indexer: { getItems: sinon.stub().returns([]) }
    },
    zeebeAPI: {
      checkConnection: sinon.stub(),
      deploy: sinon.stub(),
      startInstance: sinon.stub(),
      getGatewayVersion: sinon.stub(),
      searchProcessInstances: sinon.stub(),
      searchVariables: sinon.stub(),
      searchIncidents: sinon.stub(),
      searchElementInstances: sinon.stub(),
      searchJobs: sinon.stub(),
      searchMessageSubscriptions: sinon.stub(),
      searchUserTasks: sinon.stub()
    },
    fileSystem: {
      readFile: sinon.stub(),
      readFileStats: sinon.stub(),
      writeFile: sinon.stub()
    },
    browserOpen: sinon.stub(),
    fileExplorerOpen: sinon.stub(),
    clipboardWriteText: sinon.stub(),
    flags: { get: sinon.stub() }
  };

  // Defaults so `bootstrap()` completes without exercising real config/flags.
  services.config.get.returns(undefined);
  services.config.get.withArgs('settings').returns({});
  services.flags.get.returns(false);

  // Constructor stubs that return our service doubles.
  const ConfigStub = function() {
    return services.config;
  };
  const DialogStub = function() {
    return services.dialog;
  };
  const FileContextStub = function() {
    return services.fileContext;
  };
  const ZeebeAPIStub = function() {
    return services.zeebeAPI;
  };
  const FlagsStub = function() {
    return services.flags;
  };
  const PluginsStub = function() {
    return { getAll: () => [], getAssetPath: () => null };
  };
  const MenuStub = function() {
    return { registerMenuProvider: sinon.stub(), get: sinon.stub() };
  };
  const WindowManagerStub = function() {
    return { manage: sinon.stub() };
  };

  const fakeLog = Object.assign(
    () => ({ info() {}, warn() {}, error() {}, debug() {} }),
    { addTransports() {} }
  );

  const stubs = {
    'electron': {
      '@global': true,
      app,
      dialog: { showMessageBox: sinon.stub() },
      Menu: function() {
        return { append: sinon.stub(), popup: sinon.stub() };
      },
      MenuItem: function() {},
      screen: { on: sinon.stub() },
      session: { defaultSession: { webRequest: { onBeforeRequest: sinon.stub() } } },
      BrowserWindow: function() {
        return {};
      }
    },
    '@sentry/node': { init: sinon.stub(), setTag: sinon.stub() },
    '@camunda8/sdk': { Camunda8: function() {} },
    'epipebomb': function() {},
    './log': fakeLog,
    './log/transports': { Console: class {}, File: class {} },
    './util/renderer': renderer,
    './config': ConfigStub,
    './dialog': DialogStub,
    './flags': FlagsStub,
    './menu': MenuStub,
    './platform': { create: sinon.stub() },
    './plugins': PluginsStub,
    './window-manager': WindowManagerStub,
    './zeebe-api': ZeebeAPIStub,
    './file-context/file-context': FileContextStub,
    './file-system': services.fileSystem,
    './util/browser-open': services.browserOpen,
    './util/file-explorer-open': services.fileExplorerOpen,
    './util/clipboard-write-text': services.clipboardWriteText,
    './util/error-tracking': { start: sinon.stub(), setTag: sinon.stub() },
    './cli': {
      parse: () => ({ files: [], flags: {} }),
      appendArgs: (a) => a
    },
    './template-updater/template-updater': {
      TemplateUpdater: function() {
        return { on: sinon.stub(), update: sinon.stub() };
      },
      OOTB_CONNECTORS_ENDPOINT: { fileName: 'connectors.json' }
    },
    ...overrides.stubs
  };

  proxyquire(INDEX_PATH, stubs);

  return { renderer, app, services };
}

module.exports = {
  bootIndex,
  createFakeRenderer,
  invoke,
  invokeSync,
  loadModuleWithRenderer
};

/**
 * Invoke a captured `request-response` / `fire-and-forget` handler the way
 * `renderer.on` would: the handler is called with the provided args followed
 * by a `done` callback. Returns a promise that resolves with the `done`
 * arguments array `[err, ...results]`, plus `wasCalled()` to detect
 * fire-and-forget handlers that never reply.
 *
 * @param {object} renderer the fake renderer from `bootIndex`
 * @param {string} event
 * @param {Array<any>} [args] the args the renderer would send (excluding done)
 */
function invoke(renderer, event, args = []) {
  const handler = renderer.handlers.get(event);

  if (!handler) {
    throw new Error(`no handler registered for <${event}>`);
  }

  let called = false;
  let resolveDone;

  const donePromise = new Promise(resolve => {
    resolveDone = resolve;
  });

  const done = (...doneArgs) => {
    called = true;
    resolveDone(doneArgs);
  };

  const returnValue = Promise.resolve(handler(...args, done));

  return {
    donePromise,
    returnValue,
    wasCalled: () => called
  };
}

/**
 * Invoke a captured `sync` handler the way `renderer.onSync` would, returning
 * the value that would be assigned to `event.returnValue`.
 */
function invokeSync(renderer, event, args = []) {
  const handler = renderer.syncHandlers.get(event);

  if (!handler) {
    throw new Error(`no sync handler registered for <${event}>`);
  }

  return handler(...args);
}

/**
 * Load an `app/lib` module that registers IPC handlers in its own constructor
 * (e.g. Menu, error-tracking) with a fake `renderer` injected, so the suite can
 * capture registrations made OUTSIDE index.js.
 *
 * @param {string} relativePath path relative to `app/lib`, e.g. './menu'
 * @param {object} [extraStubs] additional proxyquire stubs
 * @returns {{ module: any, renderer: object }}
 */
function loadModuleWithRenderer(relativePath, extraStubs = {}) {
  const renderer = createFakeRenderer();
  const fakeApp = createFakeApp();

  const modulePath = require.resolve(path.resolve(__dirname, '../../', relativePath));

  const module = proxyquire(modulePath, {
    'electron': { '@global': true, app: fakeApp },
    './util/renderer': renderer,
    '../util/renderer': renderer,
    ...extraStubs
  });

  return { module, renderer, app: fakeApp };
}

