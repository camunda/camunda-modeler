/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import './ConnectionChips.less';

import {
  getBoundConnection,
  requestPicker,
  subscribe
} from './mockConnectionsStore';

/**
 * ConnectionChips — bpmn-js overlay manager that places a small Carbon-
 * style "⚠ Connect" chip below every connector task that doesn't have a
 * bound Connection.
 *
 * Mirrors ValidateBadges' shape and lifecycle: scans the element registry,
 * uses the `overlays` service to mount DOM nodes, listens to commandStack
 * + connection-store events to refresh.
 *
 * Click on a chip:
 *   1. Selects the underlying element (so the StickyConnectorRegion
 *      renders for it in the Properties tab).
 *   2. Fires `requestPicker(elementId)` so the Sticky region opens its
 *      Connection picker without a second click.
 */
export default class ConnectionChips {
  constructor(modeler) {
    this._modeler = modeler;
    this._overlays = modeler.get('overlays');
    this._eventBus = modeler.get('eventBus');
    this._elementRegistry = modeler.get('elementRegistry');
    this._elementTemplates = modeler.get('elementTemplates', false);
    this._selection = modeler.get('selection');

    this._chips = new Map(); // elementId → overlayId

    this._refresh = this._refresh.bind(this);
    this._onElementDeleted = (event) => {
      const id = event && event.element && event.element.id;
      if (id) this._removeChip(id);
    };

    // Refresh on diagram changes — covers append, change-element, and any
    // commandStack-aware mutation that might add/remove a connector task.
    this._eventBus.on('import.done', this._refresh);
    this._eventBus.on('commandStack.changed', this._refresh);
    this._eventBus.on('shape.remove', this._onElementDeleted);

    // Refresh on bind/unbind (mockConnectionsStore notifies on every change).
    this._unsubscribeStore = subscribe(this._refresh);
  }

  _refresh() {
    if (!this._elementTemplates) return;
    const elements = this._elementRegistry.getAll();
    const liveIds = new Set();

    for (const el of elements) {
      if (!el.id || !el.businessObject) continue;
      const template = this._safeGetTemplate(el);
      if (!template) continue;
      if (!isConnectorTemplate(template)) continue;

      liveIds.add(el.id);
      const bound = getBoundConnection(el.id);
      if (bound) {
        this._removeChip(el.id);
      } else if (!this._chips.has(el.id)) {
        this._mountChip(el.id);
      }
    }

    // Remove chips for elements that no longer match (template removed,
    // element deleted in a way shape.remove didn't fire, etc.).
    for (const id of Array.from(this._chips.keys())) {
      if (!liveIds.has(id)) this._removeChip(id);
    }
  }

  _safeGetTemplate(element) {
    try {
      return this._elementTemplates.get(element);
    } catch (e) {
      return null;
    }
  }

  _mountChip(elementId) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'connectors-context-chip';
    node.setAttribute('aria-label', 'Choose connection for this task');
    node.innerHTML = '<span class="connectors-context-chip__icon" aria-hidden="true">!</span>'
      + '<span>Connect</span>';

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      // Select the element so the Properties tab's StickyConnectorRegion
      // renders for it, then ask that region to open its picker.
      try {
        const el = this._elementRegistry.get(elementId);
        if (el && this._selection) this._selection.select(el);
      } catch (err) { /* prototype */ }
      requestPicker(elementId);
    });

    try {
      const overlayId = this._overlays.add(elementId, 'connectors-context-chip', {
        position: { bottom: -8, left: 0 },
        html: node
      });
      this._chips.set(elementId, overlayId);
    } catch (e) {
      // element not in registry yet — refresh will retry next time
    }
  }

  _removeChip(elementId) {
    const overlayId = this._chips.get(elementId);
    if (!overlayId) return;
    try { this._overlays.remove(overlayId); } catch (e) { /* prototype */ }
    this._chips.delete(elementId);
  }

  destroy() {
    this._eventBus.off('import.done', this._refresh);
    this._eventBus.off('commandStack.changed', this._refresh);
    this._eventBus.off('shape.remove', this._onElementDeleted);
    if (this._unsubscribeStore) this._unsubscribeStore();
    for (const overlayId of this._chips.values()) {
      try { this._overlays.remove(overlayId); } catch (e) { /* prototype */ }
    }
    this._chips.clear();
  }
}

function isConnectorTemplate(template) {
  const id = (template && template.id || '').toLowerCase();
  return id.indexOf('io.camunda.connectors.') === 0
    || id.indexOf('io.camunda.hub.connectors.') === 0
    || id.indexOf('io.camunda.agenticai.') === 0;
}
