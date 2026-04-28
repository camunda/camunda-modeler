/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * mockConnectionsStore — page-level mock state for the connectors-context
 * prototype. Mirrors the source PRD's `localConnections` + `elementConnectionMap`
 * semantics. Resets on tab unmount; nothing persists to BPMN XML or to disk.
 *
 * Two surfaces:
 *   - a list of available Connections (seeded; new ones appear when the user
 *     comes back from creating one in Hub via openHubCreate)
 *   - a map of element id → connection id (the bindings)
 *
 * No backend, no OAuth, no validation — those live upstream in the Connectors
 * team's epics (#3506, #3433). This store exists so the modeling-surface
 * prototype is interactive without those.
 */

const SEED_CONNECTIONS = [
  {
    id: 'cn-slack-sales-ops',
    name: 'Slack — Sales Ops',
    app: 'Slack',
    authMethod: 'OAuth 2.0',
    scope: 'organization',
    status: 'active',
    owner: 'diana.r@camunda',
    usedBy: 14,
    updatedAgo: '2 weeks ago'
  },
  {
    id: 'cn-slack-eng',
    name: 'Slack — Engineering',
    app: 'Slack',
    authMethod: 'OAuth 2.0',
    scope: 'workspace',
    status: 'active',
    owner: 'philipp.f@camunda',
    usedBy: 4,
    updatedAgo: '3 days ago'
  },
  {
    id: 'cn-salesforce-sales-ops',
    name: 'Salesforce — Sales Ops',
    app: 'Salesforce',
    authMethod: 'OAuth 2.0',
    scope: 'organization',
    status: 'active',
    owner: 'diana.r@camunda',
    usedBy: 9,
    updatedAgo: '1 month ago'
  },
  {
    id: 'cn-github-platform',
    name: 'GitHub — Platform',
    app: 'GitHub',
    authMethod: 'Bearer Token',
    scope: 'organization',
    status: 'active',
    owner: 'maciej.b@camunda',
    usedBy: 6,
    updatedAgo: '5 days ago'
  },
  {
    id: 'cn-rest-internal-api',
    name: 'REST — Internal API',
    app: 'REST',
    authMethod: 'API Key',
    scope: 'workspace',
    status: 'warning',
    owner: 'ali.b@camunda',
    usedBy: 2,
    updatedAgo: '1 day ago'
  }
];

let connections = SEED_CONNECTIONS.slice();
const bindings = new Map();
const listeners = new Set();
const pickerRequestListeners = new Set();

function notify() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { /* prototype */ }
  });
}

export function listConnections() {
  return connections.slice();
}

/**
 * Loose app match — used to fuzzy-filter the picker to the active template's
 * app. e.g. template "Slack Connector" matches connections with app "Slack".
 */
export function findByApp(app) {
  if (!app) return connections.slice();
  const a = String(app).toLowerCase();
  return connections.filter(c => String(c.app).toLowerCase().indexOf(a) !== -1
    || a.indexOf(String(c.app).toLowerCase()) !== -1);
}

export function getConnection(connectionId) {
  return connections.find(c => c.id === connectionId) || null;
}

export function getBoundConnection(elementId) {
  if (!elementId) return null;
  const cid = bindings.get(elementId);
  return cid ? getConnection(cid) : null;
}

export function bind(elementId, connectionId) {
  if (!elementId || !connectionId) return;
  bindings.set(elementId, connectionId);
  notify();
}

export function unbind(elementId) {
  if (!elementId) return;
  bindings.delete(elementId);
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Request the StickyConnectorRegion to open its Connection picker for a
 * specific element. Used by the canvas chip — clicking the "⚠ Connect"
 * chip on an unbound connector task selects the element AND fires this
 * request so the picker opens without a second user action.
 */
export function requestPicker(elementId) {
  pickerRequestListeners.forEach(fn => {
    try { fn(elementId); } catch (e) { /* prototype */ }
  });
}

export function onPickerRequest(fn) {
  pickerRequestListeners.add(fn);
  return () => pickerRequestListeners.delete(fn);
}

/**
 * Open the Hub create-connection flow in the OS browser. Use Electron's
 * `shell.openExternal` if available (DM context); fall back to window.open
 * for non-Electron environments. The Hub returns to the user manually;
 * `refresh()` should be called when the modeler regains focus to re-pull
 * any newly created connections (no-op against the mock seed).
 */
export function openHubCreate(app) {
  const url = 'https://connections-native-ops-prope.camunda-hub-design-prototype.pages.dev/connections/new'
    + (app ? `?app=${encodeURIComponent(app)}` : '');
  try {
    // Electron renderer exposes shell via preload — but the prototype path
    // is a window.open which Electron will route to the OS browser when the
    // window has external nav handling.
    window.open(url, '_blank', 'noopener');
  } catch (e) {
    // Last resort: navigate the current window. Not ideal but visible.
    if (typeof location !== 'undefined') location.href = url;
  }
}

/**
 * Stub — wired for future integration with a real Hub backend. In the
 * prototype this is a no-op against the seed list, but exists so callers
 * (e.g. a window-focus refresh) can be wired now and just light up later.
 */
export function refresh() {
  // no-op for prototype; future: fetch from Hub API
}

/**
 * Test affordance only. Resets the store between specs.
 */
export function _resetForTests() {
  connections = SEED_CONNECTIONS.slice();
  bindings.clear();
  listeners.clear();
}
