/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';

const SHOW_DELAY = 250;
const HIDE_DELAY = 250;

export function DefinitionTooltip({ children, definition, direction = 'right' }) {
  const [ visible, setVisible ] = useState(false);
  const [ tooltipPosition, setTooltipPosition ] = useState(null);
  const [ arrowOffset, setArrowOffset ] = useState(null);

  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const clearTimeouts = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    clearTimeout(hideTimeoutRef.current);
  }, []);

  useEffect(() => clearTimeouts, [ clearTimeouts ]);

  const show = useCallback((delay = false) => {
    clearTimeouts();
    if (delay) {
      showTimeoutRef.current = setTimeout(() => setVisible(true), SHOW_DELAY);
    } else {
      setVisible(true);
    }
  }, [ clearTimeouts ]);

  const hide = useCallback((delay = false) => {
    clearTimeouts();
    if (delay) {
      hideTimeoutRef.current = setTimeout(() => setVisible(false), HIDE_DELAY);
    } else {
      setVisible(false);
    }
  }, [ clearTimeouts ]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        hide(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ visible, hide ]);

  useLayoutEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) {
      setTooltipPosition(null);
      setArrowOffset(null);
      return;
    }

    const refRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const right = `calc(100% - ${refRect.x}px)`;
    let top = refRect.top - 10;
    let offset = null;

    if (direction === 'right') {
      const maxTop = viewportHeight - tooltipRect.height;
      const originalTop = top;

      top = Math.max(0, Math.min(top, maxTop));

      if (top !== originalTop) {
        offset = 16 - (top - originalTop);
      }
    }

    setTooltipPosition({ right, top });
    setArrowOffset(offset);
  }, [ visible, direction ]);

  const handleMouseLeave = ({ relatedTarget }) => {
    if (
      relatedTarget === wrapperRef.current ||
      relatedTarget === tooltipRef.current ||
      relatedTarget?.parentElement === tooltipRef.current
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      if (
        tooltipRef.current?.contains(range.commonAncestorContainer) ||
        tooltipRef.current?.contains(selection.anchorNode) ||
        tooltipRef.current?.contains(selection.focusNode)
      ) {
        return;
      }
    }

    hide(true);
  };

  const handleFocusOut = (e) => {
    const { relatedTarget } = e;
    if (
      tooltipRef.current?.contains(relatedTarget) ||
      wrapperRef.current?.contains(relatedTarget)
    ) {
      return;
    }
    hide(false);
  };

  const tooltipStyle = {
    ...(tooltipPosition
      ? { right: tooltipPosition.right, top: `${tooltipPosition.top}px` }
      : {}),
    '--tooltip-background-color': 'hsl(0, 0%, 22%)',
    '--tooltip-link': 'hsl(218, 100%, 74%)',
    '--tooltip-code-background-color': 'hsl(225, 10%, 97%)',
    '--tooltip-code-border-color': 'hsl(225, 10%, 85%)',
    '--text-size-small': '13px',
    '--font-family': "'IBM Plex Sans', system-ui, Arial, sans-serif"
  };

  const arrowStyle = arrowOffset != null
    ? { marginTop: `${arrowOffset}px` }
    : undefined;

  return (
    <div
      className="bio-properties-panel-tooltip-wrapper"
      style={ { padding: '2px' } }
      tabIndex="0"
      ref={ wrapperRef }
      onMouseEnter={ () => show(true) }
      onMouseLeave={ handleMouseLeave }
      onFocus={ () => show() }
      onBlur={ handleFocusOut }
      onKeyDown={ (e) => e.key === 'Escape' && hide(false) }
    >
      { children }
      { visible && (
        <div
          className={ `bio-properties-panel-tooltip ${direction}` }
          role="tooltip"
          style={ tooltipStyle }
          ref={ tooltipRef }
          onClick={ (e) => e.stopPropagation() }
          onMouseEnter={ () => clearTimeout(hideTimeoutRef.current) }
          onMouseLeave={ handleMouseLeave }
        >
          <div className="bio-properties-panel-tooltip-content">
            { definition }
          </div>
          <div
            className="bio-properties-panel-tooltip-arrow"
            style={ arrowStyle }
          />
        </div>
      ) }
    </div>
  );
}
