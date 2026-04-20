/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import ReactDOM from 'react-dom';

import * as css from './GuidedStart.less';

/**
 * Floating callout stepper shown after the user accepts a Copilot-generated
 * process. Anchors to each element in turn, driving selection +
 * scrollToElement + properties panel open. One step at a time.
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
  const resizeHandlerRef = useRef(null);

  const total = entries ? entries.length : 0;

  // Navigate to an element: select it, scroll to it, open properties panel
  const navigateToEntry = useCallback((index) => {
    if (!modeler || !entries || !entries[index]) return;

    const entry = entries[index];
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
  }, [ modeler, entries, onLayoutChanged ]);

  // Compute pixel position for the callout based on the current element
  const computePosition = useCallback((index) => {
    if (!modeler || !entries || !entries[index]) return;

    const entry = entries[index];
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
  }, [ modeler, entries ]);

  // On index change: navigate + schedule position recompute after scroll settles
  useEffect(() => {
    if (!entries || total === 0) return;

    navigateToEntry(currentIndex);

    // Immediate position compute
    computePosition(currentIndex);

    // Re-check after scroll animation (200ms)
    if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
    positionTimerRef.current = setTimeout(() => {
      computePosition(currentIndex);
    }, 200);

    return () => {
      if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
    };
  }, [ currentIndex, navigateToEntry, computePosition, entries, total ]);

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

  if (!entries || total === 0) return null;

  const entry = entries[currentIndex];
  const stepLabel = `Step ${currentIndex + 1} of ${total}`;

  const callout = (
    <div
      className={ css.copilotStepper }
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label={ `Copilot walkthrough — ${stepLabel}` }
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
        { entry.rationale || entry.narration || '' }
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
