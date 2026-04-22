/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import './ValidateBadges.less';

/**
 * ValidateBadges — per-modeler overlay manager for Validate mode.
 *
 * Listens to nothing on its own — the BpmnEditor intercepts `taskTesting.finished`
 * app events and forwards them via `record()`. Keeping the event tap upstream
 * means this class only talks to bpmn-js, which makes teardown trivial.
 *
 * Session-only: the Map is discarded on destroy(). No serialization.
 */
export default class ValidateBadges {
  constructor(modeler) {
    this._modeler = modeler;
    this._overlays = modeler.get('overlays');
    this._eventBus = modeler.get('eventBus');
    this._badges = new Map(); // elementId → overlayId

    // bpmn-js removes overlays on element delete automatically, but we still
    // need to drop the map entry so a re-added element with the same id (undo)
    // doesn't resurrect a stale record.
    this._onElementDeleted = (event) => {
      const id = event && event.element && event.element.id;
      if (id) this._badges.delete(id);
    };
    this._eventBus.on('shape.remove', this._onElementDeleted);
  }

  /**
   * record({ element, success, incident }) — replace any existing badge on
   * the element with one reflecting the new outcome.
   */
  record(payload) {
    if (!payload || !payload.element || !payload.element.id) return;

    const { element, success, incident } = payload;
    const status = deriveStatus({ success, incident });
    this._clearBadge(element.id);

    // Build as a DOM node (not an HTML string) so any future contributor who
    // extends this to include element-derived text (name, error message) can't
    // accidentally open an XSS hole. Current `status` and `glyph` are safe
    // today, but the string-interpolation form invites regressions.
    const node = document.createElement('div');
    node.className = `validate-badge validate-badge--${status}`;
    node.textContent = glyph(status);

    const overlayId = this._overlays.add(element.id, 'validate-badge', {
      position: { top: -10, right: 8 },
      html: node
    });
    this._badges.set(element.id, overlayId);
  }

  clearAll() {
    for (const overlayId of this._badges.values()) {
      this._overlays.remove(overlayId);
    }
    this._badges.clear();
  }

  destroy() {
    this.clearAll();
    this._eventBus.off('shape.remove', this._onElementDeleted);
  }

  _clearBadge(elementId) {
    const existing = this._badges.get(elementId);
    if (existing) {
      this._overlays.remove(existing);
      this._badges.delete(elementId);
    }
  }
}

function deriveStatus({ success, incident }) {
  if (incident) return 'incident';
  return success ? 'pass' : 'fail';
}

function glyph(status) {
  if (status === 'pass') return '\u2713'; // ✓
  if (status === 'fail') return '\u2715'; // ✕
  return '\u26A0'; // ⚠
}
