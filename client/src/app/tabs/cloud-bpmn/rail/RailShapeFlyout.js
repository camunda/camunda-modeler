/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { buildVariantAttrs } from './shapeVariants';

import * as css from './RailShapeFlyout.less';

/**
 * Start a create interaction for a variant, applying a connector template when
 * the variant has a `templateId` and the template is available in the modeler.
 * Falls back to bare shape placement when the template is not found.
 */
function startCreate(event, variant, modeler) {
  const create = modeler.get('create');
  const elementFactory = modeler.get('elementFactory');

  if (variant.templateId) {
    const elementTemplates = modeler.get('elementTemplates', false);
    if (elementTemplates) {
      const templates = elementTemplates.getLatest ? elementTemplates.getLatest() : [];
      const template = templates.find(t => t.id === variant.templateId);
      if (template) {
        const shape = elementTemplates.createElement(template);
        create.start(event, shape);
        return;
      }
    }
    // Fall through to bare placement if template not found (graceful degradation)
  }

  // Normal path
  const attrs = buildVariantAttrs(variant);
  const shape = elementFactory.createShape(attrs);
  create.start(event, shape);
}

/**
 * RailShapeFlyout — click-triggered popover listing shape variants.
 *
 * Design notes:
 *   - Portal-rendered to `document.body` so it escapes the rail's
 *     `overflow: hidden` clipping.
 *   - Opens anchored to the right of the primary button, vertically centered.
 *   - Dismisses on outside-click, Esc, variant select, or pointerdown (the
 *     last one ensures the flyout vanishes the instant a variant drag starts).
 *   - Keyboard: ↑/↓ cycle variants; Enter starts create for the focused variant;
 *     Esc closes.
 *
 * Props:
 *   anchorRect   — DOMRect of the triggering primary button (may be null if
 *                  closed). Used for positioning only.
 *   variants     — [{ type, label, iconClass, eventDefinitionType? }]
 *   label        — group title shown at the top of the flyout
 *   modeler      — bpmn-js instance (for create.start)
 *   onClose      — called after a variant is selected or outside click / Esc
 */
export default function RailShapeFlyout({ anchorRect, variants, label, modeler, onClose }) {
  const [ focusIdx, setFocusIdx ] = useState(0);
  const containerRef = useRef(null);

  // Reset focus on each open. A flyout "opens" whenever anchorRect changes
  // from null → a rect (or from one anchor to another, if we ever multi-anchor).
  useEffect(() => {
    if (anchorRect) setFocusIdx(0);
  }, [ anchorRect ]);

  // Outside-click + Esc dismiss.
  useEffect(() => {
    if (!anchorRect) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target)) return;
      onClose && onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose && onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ anchorRect, onClose ]);

  if (!anchorRect || typeof document === 'undefined') return null;

  const handleStart = (event, variant) => {
    if (!modeler) return;
    startCreate(event, variant, modeler);

    // Close after drag starts so the flyout doesn't linger over the canvas.
    onClose && onClose();
  };

  const handleKeyNav = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusIdx(i => Math.min(i + 1, variants.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusIdx(i => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const variant = variants[focusIdx];
      if (variant) {

        // Keyboard-triggered selection: there's no pointer event to hand to
        // create.start, so synthesize one from the current focus target.
        // Users get the same "click canvas to drop" experience as a palette pick.
        const btn = containerRef.current && containerRef.current.querySelector(`[data-variant-idx="${focusIdx}"]`);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          const fakeEvent = new MouseEvent('mousedown', {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            bubbles: true
          });
          handleStart(fakeEvent, variant);
        }
      }
    }
  };

  const top = anchorRect.top + anchorRect.height / 2;
  const left = anchorRect.right + 8;

  return createPortal(
    <div
      ref={ containerRef }
      className={ css.flyout }
      role="menu"
      aria-label={ label }
      style={ { top, left } }
      onKeyDown={ handleKeyNav }
      tabIndex={ -1 }
    >
      <div className={ css.header }>{ label }</div>
      <div className={ css.variants }>
        { variants.map((variant, idx) => (
          <button
            key={ `${variant.type}:${variant.eventDefinitionType || 'none'}:${idx}` }
            type="button"
            role="menuitem"
            data-variant-idx={ idx }
            className={ `${css.variant} ${idx === focusIdx ? css.variantFocused : ''}` }
            aria-label={ variant.label }
            onMouseEnter={ () => setFocusIdx(idx) }
            onMouseDown={ (event) => handleStart(event.nativeEvent, variant) }
          >
            { variant.iconClass && (
              <span className={ `${css.variantIcon} ${variant.iconClass}` } aria-hidden="true" />
            ) }
            <span className={ css.variantLabel }>{ variant.label }</span>
          </button>
        )) }
      </div>
    </div>,
    document.body
  );
}
