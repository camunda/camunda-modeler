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
 * The declarative IPC contract between the Electron main process (`app/lib`)
 * and the renderer (`client/`).
 *
 * This is the language-agnostic source of truth a future Rust/Tauri backend
 * must satisfy to be at parity with the current Electron backend. The
 * accompanying specs assert that the REAL backend wiring conforms to this
 * contract, so the contract cannot silently drift from the implementation.
 *
 * Channel kinds
 * -------------
 * - `request-response`: renderer → main, awaits a `done(err, result)` reply on
 *   the `${event}:response:${id}` channel. `backend.send(event, ...)` resolves
 *   with `result` (or rejects with `err`).
 * - `fire-and-forget`: renderer → main, the handler takes NO `done` callback,
 *   so the renderer's `backend.send(...)` promise NEVER resolves. This is a
 *   real, observable quirk of the current contract; a parity backend must
 *   reproduce it (or it is an explicit, reviewed behavior change).
 * - `no-handler`: present in the preload allow-list but NOT registered by any
 *   backend handler. `backend.send(...)` hangs. Vestigial surface kept for
 *   compatibility; documented so the divergence is intentional, not accidental.
 * - `sync`: renderer → main via `ipcRenderer.sendSync`, returns synchronously
 *   through `event.returnValue`. Not part of the `backend.send` allow-list.
 * - `preload`: resolved entirely in the preload script, never crosses to main.
 * - `push`: main → renderer via `webContents.send`; renderer subscribes via
 *   `backend.on(event, cb)`. The callback receives the Electron event object as
 *   its first (ignored) argument, then the payload.
 */

const REQUEST_RESPONSE = 'request-response';
const FIRE_AND_FORGET = 'fire-and-forget';
const NO_HANDLER = 'no-handler';
const SYNC = 'sync';
const PRELOAD = 'preload';
const PUSH = 'push';

/**
 * The wire envelope for `request-response` events, as implemented by
 * `app/lib/util/renderer.js`. A parity backend MUST reproduce this exactly.
 */
const ENVELOPE = {
  responseChannel: '${event}:response:${id}',

  // The response is sent as a SINGLE argument: an array `[err, ...results]`.
  responsePayloadShape: 'array',

  // Success requires `err === null` (strictly). The renderer rejects when the
  // first element is anything other than `null` (including `undefined`).
  successRequiresNullError: true,

  // Only the SECOND array element is used as the resolved value; any further
  // elements are discarded by the preload `send`.
  resolvedValueIndex: 1,

  // An `Error` is serialized as an enumerable shallow copy of the error PLUS
  // forced-enumerable `message` and `code` (which are non-enumerable on a
  // native Error). `name`, `stack` and `cause` are NOT included unless already
  // enumerable. Non-Error rejection values are passed through unchanged.
  errorSerialization: {
    includesMessage: true,
    includesCode: true,
    includesStack: false,
    includesName: false,
    nonErrorPassThrough: true
  },

  // There is no timeout. A handler that never calls `done` leaves the
  // renderer's promise pending forever (see `fire-and-forget`/`no-handler`).
  hasTimeout: false
};

/**
 * Typed fixture helpers for values that JSON cannot faithfully represent.
 * Golden fixtures use these so the Rust impl can be checked against the same
 * cross-language representation (plain JSON goldens would silently lose
 * `Buffer`, `undefined`, `Error` and `Date` semantics).
 */
const FIXTURE_TYPES = {
  buffer: (base64) => ({ $type: 'buffer', base64 }),
  undefinedValue: () => ({ $type: 'undefined' }),
  error: (value) => ({ $type: 'error', value }),
  date: (iso) => ({ $type: 'date', iso })
};

/**
 * The full event contract. Keyed by event name.
 *
 * @typedef {Object} ContractEntry
 * @property {string} kind one of the channel kinds above
 * @property {string} [registeredIn] module that registers the handler
 * @property {string} [delegatesTo] backend operation the handler calls
 * @property {string} request human-readable request arg shape
 * @property {string} response human-readable response shape (for request-response)
 * @property {string} [notes] parity-relevant caveats
 */
const CONTRACT = {

  // -- filesystem ----------------------------------------------------------
  'file:read': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'file-system#readFile',
    request: '(filePath: string, options?: { encoding?: string|false })',
    response: 'File { contents: string|Buffer, path, name, ... }',
    notes: 'options defaults to {}. With encoding:false contents is a Buffer (typed fixture). Throws -> done(err).'
  },
  'file:read-stats': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'file-system#readFileStats',
    request: '(file: File)',
    response: 'File with refreshed lastModified',
    notes: 'lastModified is an integer epoch ms; normalize in goldens.'
  },
  'file:write': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'file-system#writeFile',
    request: '(filePath: string, file: File, options?: object)',
    response: 'File { path, name, lastModified, ... }',
    notes: 'options defaults to {}. May add a file extension. Throws -> done(err).'
  },
  'file:get-path': {
    kind: PRELOAD,
    registeredIn: 'preload.js',
    request: '(file: File)',
    response: 'string path | null',
    notes: 'Resolved via webUtils.getPathForFile in preload; never reaches main. Returns null on failure.'
  },

  // -- dialogs -------------------------------------------------------------
  'dialog:open-files': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'dialog#showOpenDialog',
    request: '(options: { activeFile?: File, ... })',
    response: 'string[] filePaths',
    notes: 'Handler mutates options.defaultPath = dirname(activeFile.path) before delegating.'
  },
  'dialog:open-file-error': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'dialog#showOpenFileErrorDialog',
    request: '(options)',
    response: 'dialog response'
  },
  'dialog:save-file': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'dialog#showSaveDialog',
    request: '(options: { file: File, ... })',
    response: 'string filePath',
    notes: 'Handler mutates options.defaultPath = dirname(file.path) when file.path set.'
  },
  'dialog:show': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'dialog#showDialog',
    request: '(options)',
    response: 'dialog response'
  },
  'dialog:open-file-explorer': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'util/file-explorer-open',
    request: '(options: { path: string })',
    response: 'undefined',
    notes: 'Resolves with undefined (done(null, undefined)).'
  },

  // -- clipboard -----------------------------------------------------------
  'system-clipboard:write-text': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'util/clipboard-write-text',
    request: '(options: { text: string })',
    response: 'undefined'
  },

  // -- external ------------------------------------------------------------
  'external:open-url': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    delegatesTo: 'util/browser-open',
    request: '(options: { url: string })',
    notes: 'Handler takes no done -> renderer promise never resolves.'
  },

  // -- config --------------------------------------------------------------
  'config:get': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'config#get',
    request: '(key: string, ...args)',
    response: 'any value',
    notes: 'Variadic: handler pops the trailing done callback off args. Throws -> done(err).'
  },
  'config:set': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'config#set',
    request: '(key: string, value: any, ...args)',
    response: 'the set value',
    notes: 'Variadic: handler pops the trailing done callback off args. Throws -> done(err).'
  },

  // -- workspace -----------------------------------------------------------
  'workspace:restore': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'workspace.js',
    delegatesTo: 'config#get(workspace)',
    request: '(defaultConfig: object)',
    response: 'workspace | defaultConfig',
    notes: 'Returns defaultConfig when no saved workspace. Reads each file; unreadable files are skipped.'
  },
  'workspace:save': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'workspace.js',
    delegatesTo: 'config#set(workspace)',
    request: '(workspace: object)',
    response: 'undefined'
  },

  // -- file context --------------------------------------------------------
  'file-context:add-root': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'fileContext#addRoot',
    request: '(options: { filePath: string })',
    response: 'undefined (done(null))'
  },
  'file-context:remove-root': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'fileContext#removeRoot',
    request: '(options: { filePath: string })',
    response: 'undefined (done(null))'
  },
  'file-context:file-opened': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'fileContext#fileOpened',
    request: '(filePath: string, options: object)',
    response: 'undefined (done(null))',
    notes: 'filePath is converted to a file:// URL before delegating. May add the process-application dir as a root.'
  },
  'file-context:file-updated': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'fileContext#fileUpdated',
    request: '(filePath: string, options: object)',
    response: 'undefined (done(null))',
    notes: 'filePath converted to file:// URL before delegating.'
  },
  'file-context:file-closed': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: 'fileContext#fileClosed',
    request: '(filePath: string)',
    response: 'undefined (done(null))',
    notes: 'filePath converted to file:// URL. Skips close when part of a tracked process application.'
  },
  'file-context:changed': {
    kind: PUSH,
    registeredIn: 'index.js (renderer.send)',
    request: 'callback(event, items: Array<{ file, metadata }>)',
    notes: 'Pushed on indexer updates. Appears in the preload allow-list too, but is a main -> renderer push.'
  },

  // -- zeebe ---------------------------------------------------------------
  'zeebe:checkConnection': zeebe('checkConnection'),
  'zeebe:deploy': zeebe('deploy'),
  'zeebe:startInstance': zeebe('startInstance'),
  'zeebe:getGatewayVersion': zeebe('getGatewayVersion'),
  'zeebe:searchProcessInstances': zeebe('searchProcessInstances'),
  'zeebe:searchVariables': zeebe('searchVariables'),
  'zeebe:searchIncidents': zeebe('searchIncidents'),
  'zeebe:searchElementInstances': zeebe('searchElementInstances'),
  'zeebe:searchJobs': zeebe('searchJobs'),
  'zeebe:searchMessageSubscriptions': zeebe('searchMessageSubscriptions'),
  'zeebe:searchUserTasks': zeebe('searchUserTasks'),

  // -- lifecycle / commands (fire-and-forget) ------------------------------
  'client:ready': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    request: '()',
    notes: 'Sets app.clientReady, emits app:client-ready. No done.'
  },
  'client:error': {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    request: '(...args)',
    response: 'undefined (done(null))',
    notes: 'Variadic: pops trailing done. Logs the remaining args.'
  },
  'client:templates-update': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    request: '({ executionPlatform, executionPlatformVersion })',
    notes: 'Triggers template update. No done. Completion announced via push client:templates-update-done.'
  },
  'app:reload': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    request: '()',
    notes: 'async handler, reloads main window. No done.'
  },
  'app:restart': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    request: '()',
    notes: 'relaunches the app. No done.'
  },
  'app:quit-allowed': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js (inside app ready)',
    request: '()',
    notes: 'Registered only after app ready. Sets quitAllowed and closes the window. No done.'
  },
  'app:quit-aborted': {
    kind: NO_HANDLER,
    registeredIn: '(none)',
    request: '()',
    notes: 'In the preload allow-list and sendQuitAborted exists, but NO backend handler is registered. send() hangs. Vestigial.'
  },
  'toggle-plugins': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'index.js',
    request: '()',
    notes: 'Emits app restart with toggled --(no-)disable-plugins flag. No done.'
  },

  // -- menu ----------------------------------------------------------------
  'menu:register': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'menu/menu.js',
    request: '(providerId: string, options: object)',
    notes: 'preload registerMenu returns the (never-resolving) send promise. No done.'
  },
  'menu:update': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'menu/menu.js',
    request: '(newState: object)',
    notes: 'Also emitted internally via app.on. No done.'
  },
  'context-menu:open': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'menu/menu.js',
    request: '(type: string, attrs: object)',
    notes: 'No done.'
  },

  // -- error tracking ------------------------------------------------------
  'errorTracking:turnedOn': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'util/error-tracking.js',
    request: '()',
    notes: 'Initializes Sentry. No done.'
  },
  'errorTracking:turnedOff': {
    kind: FIRE_AND_FORGET,
    registeredIn: 'util/error-tracking.js',
    request: '()',
    notes: 'Closes Sentry. No done.'
  },

  // -- sync (sendSync) -----------------------------------------------------
  'app:get-metadata': {
    kind: SYNC,
    registeredIn: 'index.js',
    request: '()',
    response: '{ version, name }',
    notes: 'Synchronous via event.returnValue. Not in the backend.send allow-list.'
  },
  'app:get-plugins': {
    kind: SYNC,
    registeredIn: 'index.js',
    request: '()',
    response: 'Plugin[]'
  },
  'app:get-flags': {
    kind: SYNC,
    registeredIn: 'index.js',
    request: '()',
    response: 'flags object'
  },

  // -- push (main -> renderer) --------------------------------------------
  'menu:action': push('callback(event, action: string, options?: object)'),
  'client:started': push('callback(event)'),
  'client:open-files': push('callback(event, files: File[])'),
  'client:window-focused': push('callback(event)'),
  'client:window-blurred': push('callback(event)'),
  'client:templates-update-done': push('callback(event, hasNew: boolean, warnings: any[])')
};

function zeebe(op) {
  return {
    kind: REQUEST_RESPONSE,
    registeredIn: 'index.js',
    delegatesTo: `zeebe-api#${op}`,
    request: '(options: object)',
    response: 'operation result',
    notes: 'options passed through unchanged. Rejection -> done(err) with the SDK error mapped to { message, code, ...enumerable }.'
  };
}

function push(request) {
  return {
    kind: PUSH,
    registeredIn: 'index.js (renderer.send)',
    request
  };
}

/**
 * Events the renderer is allowed to `backend.send`, per
 * `app/lib/preload.js`'s allow-list. Kept here as the canonical copy the
 * surface-lock test reconciles against. NOTE the historical duplicate of
 * `file-context:remove-root` in the source allow-list is intentionally
 * deduplicated here.
 */
const PRELOAD_ALLOWED_EVENTS = [
  'file:get-path',
  'app:reload',
  'app:restart',
  'app:quit-aborted',
  'app:quit-allowed',
  'client:error',
  'client:ready',
  'client:templates-update',
  'config:get',
  'config:set',
  'context-menu:open',
  'dialog:open-file-error',
  'dialog:open-file-explorer',
  'dialog:open-files',
  'dialog:save-file',
  'dialog:show',
  'errorTracking:turnedOff',
  'errorTracking:turnedOn',
  'external:open-url',
  'file:read',
  'file:read-stats',
  'file:write',
  'file-context:add-root',
  'file-context:remove-root',
  'file-context:changed',
  'file-context:file-closed',
  'file-context:file-opened',
  'file-context:file-updated',
  'menu:register',
  'menu:update',
  'system-clipboard:write-text',
  'toggle-plugins',
  'workspace:restore',
  'workspace:save',
  'zeebe:checkConnection',
  'zeebe:deploy',
  'zeebe:getGatewayVersion',
  'zeebe:startInstance',
  'zeebe:searchProcessInstances',
  'zeebe:searchElementInstances',
  'zeebe:searchVariables',
  'zeebe:searchIncidents',
  'zeebe:searchJobs',
  'zeebe:searchMessageSubscriptions',
  'zeebe:searchUserTasks'
];

function eventsByKind(...kinds) {
  return Object.keys(CONTRACT).filter(name => kinds.includes(CONTRACT[name].kind));
}

module.exports = {
  CONTRACT,
  ENVELOPE,
  FIXTURE_TYPES,
  PRELOAD_ALLOWED_EVENTS,
  eventsByKind,
  KINDS: {
    REQUEST_RESPONSE,
    FIRE_AND_FORGET,
    NO_HANDLER,
    SYNC,
    PRELOAD,
    PUSH
  }
};
