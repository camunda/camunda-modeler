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
import { isRunnable } from './runnability';

/**
 * ValidateBadges — per-modeler overlay manager for Validate mode.
 *
 * Manages two kinds of overlay, both using bpmn-js `overlays` service:
 *
 *   1. Result badges (✓ / ✕ / ⚠) — placed by record() after a run.
 *   2. Runnable indicators (▶) — placed by showRunnableIndicators() when
 *      entering Validate mode; removed when a badge is placed on that element.
 *
 * Listens to nothing on its own — the BpmnEditor intercepts `taskTesting.finished`
 * app events and forwards them via `record()`. Keeping the event tap upstream
 * means this class only talks to bpmn-js, which makes teardown trivial.
 *
 * Session-only: all Maps are discarded on destroy(). No serialization.
 */
export default class ValidateBadges {
  constructor(modeler) {
    this._modeler = modeler;
    this._overlays = modeler.get('overlays');
    this._eventBus = modeler.get('eventBus');
    this._badges = new Map();     // elementId → overlayId (result badge)
    this._status = new Map();     // elementId → 'pass'|'fail'|'incident'
    this._indicators = new Map(); // elementId → overlayId (runnable indicator)

    // bpmn-js removes overlays on element delete automatically, but we still
    // need to drop the map entries so a re-added element (undo) doesn't
    // resurrect stale records.
    this._onElementDeleted = (event) => {
      const id = event && event.element && event.element.id;
      if (id) {
        this._badges.delete(id);
        this._status.delete(id);
        this._indicators.delete(id);
      }
    };
    this._eventBus.on('shape.remove', this._onElementDeleted);
  }

  /**
   * record({ element, success, incident }) — replace any existing badge on
   * the element with one reflecting the new outcome. Also removes the
   * runnable indicator for that element (badge takes precedence).
   */
  record(payload) {
    if (!payload || !payload.element || !payload.element.id) return;

    const { element, success, incident } = payload;
    const status = deriveStatus({ success, incident });
    this._clearBadge(element.id);
    this._clearIndicator(element.id); // badge replaces indicator

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
    this._status.set(element.id, status);
  }

  /**
   * getResults() — snapshot of current badge statuses.
   * Returns Map<elementId, 'pass'|'fail'|'incident'>.
   * The returned Map is a copy — callers must not mutate it.
   */
  getResults() {
    return new Map(this._status);
  }

  /**
   * showRunnableIndicators(elements) — mounts a ▶ indicator on every element
   * that is runnable and does not already have a result badge or an indicator.
   * Call this when entering Validate mode.
   *
   * elements: array of bpmn-js shape elements (from elementRegistry.getAll()).
   */
  showRunnableIndicators(elements) {
    for (const el of elements) {
      if (!el.id || this._badges.has(el.id) || this._indicators.has(el.id)) continue;
      let enabled = false;
      try {
        enabled = isRunnable(el).enabled;
      } catch (e) {
        continue;
      }
      if (!enabled) continue;
      this._mountIndicator(el.id);
    }
  }

  /**
   * hideRunnableIndicators() — removes all runnable indicator overlays.
   * Call this when leaving Validate mode.
   */
  hideRunnableIndicators() {
    for (const overlayId of this._indicators.values()) {
      this._overlays.remove(overlayId);
    }
    this._indicators.clear();
  }

  clearAll() {
    for (const overlayId of this._badges.values()) {
      this._overlays.remove(overlayId);
    }
    this._badges.clear();
    this._status.clear();
    this.hideRunnableIndicators();
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
      this._status.delete(elementId);
    }
  }

  _clearIndicator(elementId) {
    const existing = this._indicators.get(elementId);
    if (existing) {
      this._overlays.remove(existing);
      this._indicators.delete(elementId);
    }
  }

  _mountIndicator(elementId) {
    const node = document.createElement('div');
    node.className = 'validate-runnable';
    node.textContent = '\u25B6'; // ▶
    try {
      const overlayId = this._overlays.add(elementId, 'validate-runnable', {
        position: { top: -10, right: 8 },
        html: node
      });
      this._indicators.set(elementId, overlayId);
    } catch (e) {
      // element may not be in the registry yet — ignore
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
