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
 * Vertically re-center the context pad against its target element.
 *
 * bpmn-js positions the context pad at the top-right corner of the element.
 * For small elements that's fine — the pad reads as "attached to the right
 * side." For large elements (expanded subprocesses, ad-hoc subprocesses,
 * wide custom shapes) the pad floats near the top, disconnected from the
 * element's visual center of mass.
 *
 * This service listens for the pad to open and nudges its `style.top` so
 * the pad's vertical midpoint matches the element's vertical midpoint. It
 * repositions on viewbox changes (pan/zoom) and element changes (resize)
 * for the same reason ElementActionsStrip does.
 *
 * Implementation note: we only adjust `top`. bpmn-js' own `left` placement
 * (element.right + margin) is correct — we don't fight it.
 */
export default function ContextPadCenter(eventBus, canvas, contextPad) {
  this._canvas = canvas;
  this._contextPad = contextPad;

  this._currentTarget = null;

  const self = this;

  eventBus.on('contextPad.open', function(event) {
    self._currentTarget = event.current && event.current.target;

    // bpmn-js positions the pad synchronously during its own `contextPad.open`
    // handler. Our event runs alongside, so defer one frame to ensure our
    // style adjustment runs AFTER bpmn-js has set its initial `top`.
    requestAnimationFrame(function() {
      self._recenter();
    });
  });

  eventBus.on('contextPad.close', function() {
    self._currentTarget = null;
  });

  eventBus.on('canvas.viewbox.changed', function() {
    self._recenter();
  });

  eventBus.on('elements.changed', function() {
    self._recenter();
  });
}

ContextPadCenter.$inject = [ 'eventBus', 'canvas', 'contextPad' ];

ContextPadCenter.prototype._recenter = function() {
  const target = this._currentTarget;
  if (!target) return;

  // Multi-select: bpmn-js shows a reduced pad; skip re-centering.
  if (Array.isArray(target)) return;

  if (!this._contextPad.isOpen || !this._contextPad.isOpen()) return;

  const current = this._contextPad._current;
  if (!current || !current.html) return;

  const padEl = current.html;

  const canvas = this._canvas;
  const containerBounds = canvas.getContainer().getBoundingClientRect();

  const gfx = canvas.getGraphics(target);
  if (!gfx) return;

  const targetBounds = gfx.getBoundingClientRect();
  const padHeight = padEl.getBoundingClientRect().height;

  // Target's vertical center in container-local coordinates.
  const targetCenterY = targetBounds.top - containerBounds.top + targetBounds.height / 2;

  // New top so the pad's midpoint matches the element's midpoint.
  const newTop = Math.round(targetCenterY - padHeight / 2);

  padEl.style.top = newTop + 'px';
};
