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
 * DOM split: pull element-maintenance actions (change type, color, annotation,
 * delete) out of bpmn-js' context pad and into a standalone floating strip
 * positioned centered above the element.
 *
 * Approach
 * --------
 * On every `contextPad.open` we:
 *   1. Create a fresh floating `<div class="element-actions-strip">` appended
 *      to the same canvas container bpmn-js uses for its own pad.
 *   2. Locate the specific entry DOM nodes in the pad by `data-action` and
 *      *move* them into our strip. The entries keep their `data-action`
 *      attribute and the rest of their DOM structure.
 *   3. Re-delegate click / mouseover / mouseout on the strip and forward to
 *      `contextPad.trigger`. bpmn-js binds these listeners on the pad root
 *      via `min-dom` event delegation (see ContextPad.js); once we move an
 *      entry out of the pad's DOM, the pad's delegated listeners no longer
 *      catch its events, so we rebind equivalent delegation on the strip.
 *   4. Measure and position the strip centered above the element in the same
 *      coordinate system bpmn-js uses for the pad (container-local, accounting
 *      for canvas pan/zoom).
 *
 * On `contextPad.close` we tear the strip down. bpmn-js recreates the entry
 * DOM on every open, so there's nothing to restore.
 *
 * On `canvas.viewbox.changed` / `elements.changed` we reposition.
 */

import { delegate as domDelegate } from 'min-dom';

const ENTRY_SELECTOR = '.entry';

// Entries to move into the top strip, in the order they should appear.
// bpmn-js default context-pad action ids (see ContextPadProvider):
//   - `replace`                   → change type
//   - `set-color`                 → color picker (added by bpmn-js-color-picker)
//   - `append.text-annotation`    → annotation
//   - `delete`                    → delete
const TOP_STRIP_ACTIONS = [
  'replace',
  'set-color',
  'append.text-annotation',
  'delete'
];

// How far above the element (in pixels) the strip should float.
const MARGIN_ABOVE_ELEMENT = 12;


export default function ElementActionsStrip(eventBus, canvas, contextPad) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._contextPad = contextPad;

  this._stripEl = null;
  this._currentTarget = null;

  const self = this;

  eventBus.on('contextPad.open', function(event) {
    self._build(event.current);
  });

  eventBus.on('contextPad.close', function() {
    self._destroy();
  });

  eventBus.on('canvas.viewbox.changed', function() {
    self._reposition();
  });

  eventBus.on('elements.changed', function() {
    self._reposition();
  });
}

ElementActionsStrip.$inject = [ 'eventBus', 'canvas', 'contextPad' ];


// ---- Build / destroy ------------------------------------------------------

ElementActionsStrip.prototype._build = function(current) {
  if (!current || !current.html || !current.target) return;

  // Multi-select: no strip (bpmn-js offers a reduced pad anyway).
  if (Array.isArray(current.target)) return;

  const padHtml = current.html;
  const entries = [];

  // Pull entries in the configured order (not whatever DOM order bpmn-js used)
  TOP_STRIP_ACTIONS.forEach(function(action) {
    const entry = padHtml.querySelector('.entry[data-action="' + action + '"]');
    if (entry) entries.push(entry);
  });

  if (entries.length === 0) return;

  const strip = document.createElement('div');
  strip.className = 'element-actions-strip';

  entries.forEach(function(entry) {

    // Moving the node out of its current parent. The `data-action` attribute
    // is preserved, which is what bpmn-js' `trigger()` uses to route actions.
    strip.appendChild(entry);
  });

  // bpmn-js binds click/mouseover/mouseout on its pad root via event
  // delegation. Our moved entries are no longer descendants of that root, so
  // we rebind equivalent delegation on the strip and forward to trigger().
  const contextPad = this._contextPad;

  domDelegate.bind(strip, ENTRY_SELECTOR, 'click', function(event) {
    contextPad.trigger('click', event);
  });
  domDelegate.bind(strip, ENTRY_SELECTOR, 'mouseover', function(event) {
    contextPad.trigger('mouseover', event);
  });
  domDelegate.bind(strip, ENTRY_SELECTOR, 'mouseout', function(event) {
    contextPad.trigger('mouseout', event);
  });

  this._canvas.getContainer().appendChild(strip);
  this._stripEl = strip;
  this._currentTarget = current.target;

  this._reposition();
};

ElementActionsStrip.prototype._destroy = function() {
  if (this._stripEl && this._stripEl.parentNode) {
    this._stripEl.parentNode.removeChild(this._stripEl);
  }
  this._stripEl = null;
  this._currentTarget = null;
};


// ---- Positioning ----------------------------------------------------------

ElementActionsStrip.prototype._reposition = function() {
  if (!this._stripEl || !this._currentTarget) return;
  if (!this._contextPad.isOpen()) return;

  const canvas = this._canvas;
  const container = canvas.getContainer();
  const containerBounds = container.getBoundingClientRect();

  // Mirror bpmn-js' own targetBounds math so the strip shares the pad's
  // coordinate system (container-local, screen-space units).
  const gfx = canvas.getGraphics(this._currentTarget);
  if (!gfx) return;

  const targetBounds = gfx.getBoundingClientRect();
  const elementLeft = targetBounds.left - containerBounds.left;
  const elementTop = targetBounds.top - containerBounds.top;
  const elementCenterX = elementLeft + targetBounds.width / 2;

  // Measure the strip (layout must have happened — it has, we're post-append).
  const stripWidth = this._stripEl.offsetWidth;
  const stripHeight = this._stripEl.offsetHeight;

  let left = Math.round(elementCenterX - stripWidth / 2);
  const top = Math.round(elementTop - stripHeight - MARGIN_ABOVE_ELEMENT);

  // Keep the strip inside the canvas container so it never flies offscreen
  // when the element is scrolled near the left/right edge.
  const containerWidth = containerBounds.width;
  if (left < 4) left = 4;
  if (left + stripWidth > containerWidth - 4) left = containerWidth - stripWidth - 4;

  this._stripEl.style.left = left + 'px';
  this._stripEl.style.top = top + 'px';
};
