/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';

import * as css from './RailTooltip.less';

/**
 * Why a custom tooltip?
 *
 *   - Native `title` has a ~1500ms OS-level delay — feels broken on a rail
 *     where users scan icons quickly.
 *   - Shape buttons bind `onMouseDown` to `create.start()`, which captures the
 *     pointer to track the drag. Browsers cancel any pending native tooltip
 *     when that happens, so shape tooltips effectively never appear.
 *   - We also want to include a keyboard hint (hotkey pill) alongside the
 *     label — native `title` can't render markup.
 *
 * Design:
 *   - Singleton tooltip rendered in a portal attached to `document.body` so
 *     it escapes the rail's `overflow: hidden` clipping.
 *   - Hook `useRailTooltipAnchor({ label, hotkey })` returns pointer handlers
 *     to spread on the anchor element. Show-delay 150ms; hides immediately
 *     on `pointerdown` / `pointerleave` / focus loss.
 *   - Positioned to the right of the anchor with an 8px gap; vertically
 *     centered on the anchor's mid-line.
 */

const RailTooltipContext = createContext(null);

export function RailTooltipProvider({ children }) {
  const [ state, setState ] = useState({ visible: false, label: '', hotkey: '', x: 0, y: 0 });
  const timerRef = useRef(null);

  const show = useCallback((rect, label, hotkey) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setState({
        visible: true,
        label,
        hotkey: hotkey || '',
        x: rect.right + 8,
        y: rect.top + rect.height / 2
      });
    }, 150);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    setState(prev => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const value = { show, hide };

  return (
    <RailTooltipContext.Provider value={ value }>
      { children }
      { state.visible && typeof document !== 'undefined' && createPortal(
        <div
          className={ css.tooltip }
          role="tooltip"
          style={ { top: state.y, left: state.x } }
        >
          <span className={ css.label }>{ state.label }</span>
          { state.hotkey && <kbd className={ css.hotkey }>{ state.hotkey }</kbd> }
        </div>,
        document.body
      ) }
    </RailTooltipContext.Provider>
  );
}

/**
 * useRailTooltipAnchor — returns event handlers to spread onto a button.
 *
 * Usage:
 *   const anchorProps = useRailTooltipAnchor({ label: 'Hand', hotkey: 'H' });
 *   <button {...anchorProps} onClick={...}>...</button>
 *
 * If the consumer also needs its own pointer handlers (e.g. `onMouseDown` to
 * start a drag), spread `anchorProps` first and then add the handler after —
 * React merges them; we don't call stopPropagation.
 */
export function useRailTooltipAnchor({ label, hotkey } = {}) {
  const ctx = useContext(RailTooltipContext);

  return {
    onPointerEnter: (event) => {
      if (!ctx || !label) return;
      const rect = event.currentTarget.getBoundingClientRect();
      ctx.show(rect, label, hotkey);
    },
    onPointerLeave: () => { ctx && ctx.hide(); },
    onPointerDown: () => { ctx && ctx.hide(); },
    onBlur: () => { ctx && ctx.hide(); }
  };
}
