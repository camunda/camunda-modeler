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

// Flatten entries into a single ordered list of { entry, substep, entryIndex }.
// Entries with no substeps contribute a single { entry, substep: null } item.
function flattenSubsteps(entries) {
  if (!entries) return [];

  const flat = [];
  entries.forEach((entry, entryIndex) => {
    const substeps = Array.isArray(entry.substeps) ? entry.substeps : [];
    if (substeps.length === 0) {
      flat.push({ entry, substep: null, entryIndex });
    } else {
      substeps.forEach(substep => {
        flat.push({ entry, substep, entryIndex });
      });
    }
  });
  return flat;
}

// Try to find and open a properties-panel group by id, then scroll it into
// view. Wrapped in try/catch so DOM absence never blows up the stepper.
function focusPropertiesGroup(groupId) {
  if (!groupId) return;
  try {
    const selector = `[data-group-id="group-${ groupId }"]`;
    const el = document.querySelector(selector);
    if (!el) return;

    // bpmn-js-properties-panel: header toggles via click; `.open` on the
    // header indicates current open state.
    const header = el.querySelector('.bio-properties-panel-group-header');
    if (header && !header.classList.contains('open')) {
      header.click();
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (_) {

    // no-op — DOM can be gone mid-teardown.
  }
}

/**
 * Floating callout stepper shown after the user accepts a Copilot-generated
 * process. Anchors to each element in turn, driving selection +
 * scrollToElement + properties panel open. One substep at a time.
 *
 * @param {object} props
 * @param {Array}  props.entries         copilotLog entries
 * @param {object} props.modeler         bpmn-js Modeler instance
 * @param {Function} props.onDismiss     called when the user closes the stepper
 * @param {Function} props.onLayoutChanged  called with layout patch to open props panel
 */
export default function CopilotStepper({ entries, modeler, onDismiss, onLayoutChanged }) {
  const [ currentIndex, setCurrentIndex ] = useState(0);
  const [ position, setPosition ] = useState({ top: 120, left: 120 });
  const positionTimerRef = useRef(null);
  const groupFocusTimerRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const lastEntryIndexRef = useRef(null);

  const flatSteps = useMemo(() => flattenSubsteps(entries), [ entries ]);
  const total = flatSteps.length;

  // Select and scroll-to the element for a flat step index. Only re-navigates
  // if the underlying element changed since the last step — substeps within
  // the same element don't re-select.
  const navigateToStep = useCallback((index) => {
    if (!modeler || !flatSteps[index]) return;

    const { entry, entryIndex } = flatSteps[index];

    if (lastEntryIndexRef.current === entryIndex) {
      return; // same element — don't re-select
    }
    lastEntryIndexRef.current = entryIndex;

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
  }, [ modeler, flatSteps, onLayoutChanged ]);

  // Compute pixel position for the callout based on the current entry's element
  const computePosition = useCallback((index) => {
    if (!modeler || !flatSteps[index]) return;

    const { entry } = flatSteps[index];
    const elementRegistry = modeler.get('elementRegistry');
    const canvas = modeler.get('canvas');

    const element = elementRegistry.get(entry.elementId);
    if (!element) return;

    const graphics = canvas.getGraphics(element);
    if (!graphics) return;

    const elRect = graphics.getBoundingClientRect();
    const CALLOUT_WIDTH = 380;
    const CALLOUT_GAP = 12;
    const CALLOUT_MAX_HEIGHT = 360; // approximate max

    let left = elRect.right + CALLOUT_GAP;
    let top = elRect.top;

    // Overflow right — align right edge of callout to viewport right with 16px margin
    if (left + CALLOUT_WIDTH > window.innerWidth - 16) {
      left = Math.max(16, elRect.left - CALLOUT_WIDTH - CALLOUT_GAP);
    }

    // Overflow bottom — flip above
    if (top + CALLOUT_MAX_HEIGHT > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - CALLOUT_MAX_HEIGHT - 16);
    }

    setPosition({ top, left });
  }, [ modeler, flatSteps ]);

  // On index change: navigate (if element changed) + focus group + schedule
  // position recompute after scroll settles.
  useEffect(() => {
    if (total === 0) return;

    navigateToStep(currentIndex);

    // Focus the matching properties-panel group after selection has a chance
    // to rerender the panel.
    const substep = flatSteps[currentIndex] && flatSteps[currentIndex].substep;
    if (groupFocusTimerRef.current) clearTimeout(groupFocusTimerRef.current);
    if (substep && substep.groupId) {
      groupFocusTimerRef.current = setTimeout(() => {
        focusPropertiesGroup(substep.groupId);
      }, 100);
    }

    // Immediate position compute
    computePosition(currentIndex);

    // Re-check after scroll animation (200ms)
    if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
    positionTimerRef.current = setTimeout(() => {
      computePosition(currentIndex);
    }, 200);

    return () => {
      if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
      if (groupFocusTimerRef.current) clearTimeout(groupFocusTimerRef.current);
    };
  }, [ currentIndex, navigateToStep, computePosition, flatSteps, total ]);

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

  if (total === 0) return null;

  const { entry, substep } = flatSteps[currentIndex];
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
      style={{ top: position.top, left: position.left }}
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
