/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import ReactDOM from 'react-dom';

import * as css from './GuidedStart.less';

// Heuristic: does this value look like an expression / code snippet that
// should render in a monospace box?
function looksLikeCode(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  return value.startsWith('=') || value.includes('{{') || value.includes('->');
}

// Build the flat substep list for a single scoped entry. Returns
// [{ entry, substep }, ...]. Entries without substeps contribute one
// item with substep: null so they still render a single summary card.
function substepsForEntry(entry) {
  if (!entry) return [];
  const substeps = Array.isArray(entry.substeps) ? entry.substeps : [];
  if (substeps.length === 0) {
    return [ { entry, substep: null } ];
  }
  return substeps.map(substep => ({ entry, substep }));
}

// Resolve the DOM node we want the callout to anchor to. Preference order:
//   1. The specific properties-panel entry (field input row) matching
//      group + field label.
//   2. The properties-panel group container (section).
//   3. null → caller falls back to the canvas element.
//
// Also ensures the group is expanded and scrolls the field into view so the
// callout pointer actually lands on something the user can see.
function focusPropertiesField(groupId, fieldLabel) {
  if (!groupId) return null;
  try {
    // bpmn-js-properties-panel wraps element-template custom groups with
    // `group-ElementTemplates__CustomProperties-<groupId>`; native groups use
    // the plain `group-<groupId>`. Try both, template form first.
    const group =
      document.querySelector(`[data-group-id="group-ElementTemplates__CustomProperties-${ groupId }"]`)
      || document.querySelector(`[data-group-id="group-${ groupId }"]`);
    if (!group) return null;

    const header = group.querySelector('.bio-properties-panel-group-header');
    if (header && !header.classList.contains('open')) {
      header.click();
    }

    if (!fieldLabel) {
      group.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return group;
    }

    // Find the entry whose visible label matches the substep field. bpmn-js-
    // properties-panel renders labels either on <label> or as an element with
    // the label class; try both.
    const entries = group.querySelectorAll('.bio-properties-panel-entry');
    const target = Array.from(entries).find(el => {
      const labelEl = el.querySelector('label, .bio-properties-panel-label');
      if (!labelEl) return false;
      const text = labelEl.textContent.trim();
      return text === fieldLabel || text.startsWith(fieldLabel);
    });

    const anchor = target || group;
    anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return anchor;
  } catch (_) {

    // no-op — DOM can be gone mid-teardown.
    return null;
  }
}

/**
 * Floating callout stepper shown after the user clicks a log entry in the AI
 * panel. Scoped to a single copilotLog entry: the callout walks that entry's
 * substeps only. The callout anchors to the matching properties-panel field;
 * if no field match is found it falls back to the canvas element.
 *
 * @param {object} props
 * @param {Array}  props.entries              copilotLog entries
 * @param {number} props.scopedEntryIndex     index into entries to walk
 * @param {object} props.modeler              bpmn-js Modeler instance
 * @param {Function} props.onDismiss          called when the user closes the stepper
 * @param {Function} props.onLayoutChanged    called with layout patch to open props panel
 */
export default function CopilotStepper({ entries, scopedEntryIndex, modeler, onDismiss, onLayoutChanged }) {
  const [ currentIndex, setCurrentIndex ] = useState(0);
  const [ position, setPosition ] = useState({ top: 120, left: 120, arrowSide: 'left', arrowTop: 16 });
  const positionTimerRef = useRef(null);
  const fieldFocusTimerRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  const entry = entries && entries[scopedEntryIndex];
  const flatSteps = useMemo(() => substepsForEntry(entry), [ entry ]);
  const total = flatSteps.length;

  // Reset to substep 1 whenever the scoped entry changes.
  useEffect(() => {
    setCurrentIndex(0);
  }, [ scopedEntryIndex ]);

  // Select + scroll-to the canvas element + open the properties panel.
  // Scoped mode always targets the same element, so this runs once per
  // scope change (driven by scopedEntryIndex).
  useEffect(() => {
    if (!modeler || !entry) return;

    const elementRegistry = modeler.get('elementRegistry');
    const selection = modeler.get('selection');
    const canvas = modeler.get('canvas');

    const element = elementRegistry.get(entry.elementId);
    if (!element) return;

    selection.select(element);

    try {
      canvas.scrollToElement(element, { left: 80, right: 80, top: 80, bottom: 80 });
    } catch (_) {
      // no-op — can throw if element is off-canvas
    }

    if (onLayoutChanged) {
      onLayoutChanged({
        sidePanel: {
          open: true,
          tab: 'properties'
        }
      });
    }
  }, [ modeler, entry, onLayoutChanged ]);

  // Compute pixel position for the callout. Preferred anchor is the
  // properties-panel field DOM node for the current substep; falls back to
  // the group container, then to the canvas element.
  const computePosition = useCallback((index) => {
    if (!modeler || !entry || !flatSteps[index]) return;

    const { substep } = flatSteps[index];

    let anchorRect = null;
    let anchorSide = 'right'; // which side of the anchor to place the callout

    // Try properties-panel field first
    if (substep && substep.groupId) {
      const fieldEl = focusPropertiesField(substep.groupId, substep.field);
      if (fieldEl) {
        anchorRect = fieldEl.getBoundingClientRect();
        anchorSide = 'left'; // properties panel is on the right, so the callout sits to the left of it
      }
    }

    // Fallback: canvas element
    if (!anchorRect) {
      const elementRegistry = modeler.get('elementRegistry');
      const canvas = modeler.get('canvas');
      const element = elementRegistry.get(entry.elementId);
      if (!element) return;
      const graphics = canvas.getGraphics(element);
      if (!graphics) return;
      anchorRect = graphics.getBoundingClientRect();
      anchorSide = 'right';
    }

    const CALLOUT_WIDTH = 380;
    const CALLOUT_GAP = 12;
    const CALLOUT_MAX_HEIGHT = 360;

    // The arrow's side on the callout is the *opposite* of which side of the
    // anchor the callout sits on. If the callout is to the LEFT of the anchor
    // (anchorSide='left'), the arrow lives on the callout's RIGHT edge
    // pointing right. Track it so we can flip later if we overflow.
    let arrowSide = anchorSide === 'left' ? 'right' : 'left';

    let left;
    if (anchorSide === 'left') {
      left = anchorRect.left - CALLOUT_WIDTH - CALLOUT_GAP;
      if (left < 16) {
        // Not enough room on the left — flip the callout to the right of the anchor.
        left = anchorRect.right + CALLOUT_GAP;
        arrowSide = 'left';
      }
    } else {
      left = anchorRect.right + CALLOUT_GAP;
      if (left + CALLOUT_WIDTH > window.innerWidth - 16) {
        left = Math.max(16, anchorRect.left - CALLOUT_WIDTH - CALLOUT_GAP);
        arrowSide = 'right';
      }
    }

    // Align the arrow vertically with the middle of the anchor element, so
    // it points at the field/shape rather than landing at an arbitrary offset.
    let top = anchorRect.top;
    if (top + CALLOUT_MAX_HEIGHT > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - CALLOUT_MAX_HEIGHT - 16);
    }
    const anchorCenterY = anchorRect.top + anchorRect.height / 2;
    const arrowTop = Math.max(12, Math.min(anchorCenterY - top, CALLOUT_MAX_HEIGHT - 12));

    setPosition({ top, left, arrowSide, arrowTop });
  }, [ modeler, entry, flatSteps ]);

  // On substep change: focus the field (also expands the group) and compute
  // the callout position twice — once immediately, once after the scroll
  // animation settles.
  useEffect(() => {
    if (total === 0) return;

    // Initial position compute (focuses the field as a side effect)
    if (fieldFocusTimerRef.current) clearTimeout(fieldFocusTimerRef.current);
    fieldFocusTimerRef.current = setTimeout(() => {
      computePosition(currentIndex);
    }, 100);

    computePosition(currentIndex);

    if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
    positionTimerRef.current = setTimeout(() => {
      computePosition(currentIndex);
    }, 300);

    return () => {
      if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
      if (fieldFocusTimerRef.current) clearTimeout(fieldFocusTimerRef.current);
    };
  }, [ currentIndex, computePosition, total ]);

  // Recompute position on window resize
  useEffect(() => {
    const handler = () => computePosition(currentIndex);
    resizeHandlerRef.current = handler;
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [ currentIndex, computePosition ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setCurrentIndex(i => Math.min(i + 1, total - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [ total, onDismiss ]);

  if (total === 0 || !entry) return null;

  const { substep } = flatSteps[currentIndex];
  const stepLabel = `Step ${ currentIndex + 1 } of ${ total }`;

  // Build field-path label like "HTTP ENDPOINT → URL". Fallback to just
  // the field name if no groupId.
  let fieldPathLabel = '';
  if (substep) {
    const groupLabel = substep.groupId ? substep.groupId.replace(/([A-Z])/g, ' $1').trim() : '';
    fieldPathLabel = groupLabel
      ? `${ groupLabel } → ${ substep.field }`
      : substep.field;
  }

  const callout = (
    <div
      className={ css.copilotStepper }
      style={{ top: position.top, left: position.left, '--arrow-top': `${ position.arrowTop }px` }}
      data-arrow-side={ position.arrowSide }
      role="dialog"
      aria-label={ `Copilot walkthrough — ${ stepLabel }` }
    >
      <div className={ css.copilotStepperStepNumber }>
        { stepLabel }
      </div>
      <div className={ css.copilotStepperHeader }>
        <span className={ css.copilotStepperHeading }>
          { entry.name || entry.bpmnType || 'Step' }
        </span>
        <button
          type="button"
          className={ css.copilotStepperClose }
          onClick={ onDismiss }
          aria-label="Dismiss walkthrough"
        >
          ×
        </button>
      </div>
      <div className={ css.copilotStepperBody }>
        { substep ? (
          <div className={ css.copilotStepperSubstep }>
            <div className={ css.copilotStepperFieldPath }>
              { fieldPathLabel }
            </div>
            { substep.value ? (
              <div
                className={ css.copilotStepperFieldValue }
                data-monospace={ looksLikeCode(substep.value) ? 'true' : 'false' }
              >
                { substep.value }
              </div>
            ) : null }
            <div className={ css.copilotStepperFieldWhy }>
              { substep.why }
            </div>
          </div>
        ) : (
          entry.rationale || entry.narration || ''
        ) }
      </div>
      <div className={ css.copilotStepperFooter }>
        <button
          type="button"
          className={ css.copilotStepperPrev }
          onClick={ () => setCurrentIndex(i => Math.max(i - 1, 0)) }
          disabled={ currentIndex === 0 }
        >
          &#171; Prev
        </button>
        <button
          type="button"
          className={ css.copilotStepperNext }
          onClick={ () => setCurrentIndex(i => Math.min(i + 1, total - 1)) }
          disabled={ currentIndex === total - 1 }
        >
          Next &#187;
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(callout, document.body);
}
