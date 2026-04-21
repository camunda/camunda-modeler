/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import modeConfig, { MODES } from '../mode/modeConfig';

import * as css from './ModeRail.less';

/**
 * RailModesSection — four vertically-stacked mode chips (Design / Implement /
 * Simulate / Test). Active chip gets a colored band derived from the mode's
 * themeClass. Tooltip includes the keyboard hint.
 */
export default function RailModesSection({ mode, onSelect }) {
  return (
    <div
      className={ css.modesSection }
      role="tablist"
      aria-label="Editor mode"
    >
      { MODES.map(m => {
        const cfg = modeConfig[m];
        const isActive = m === mode;
        return (
          <button
            key={ m }
            type="button"
            role="tab"
            aria-selected={ isActive }
            className={ `${css.modeButton} ${css['modeButton--' + m]} ${isActive ? css['modeButton--active'] : ''}` }
            title={ `${cfg.label} mode (⌘${cfg.hotkey} / Ctrl+${cfg.hotkey})` }
            onClick={ () => onSelect(m) }
          >
            <ModeIcon mode={ m } />
            <span className={ css.modeLabel }>{ cfg.label }</span>
          </button>
        );
      }) }
    </div>
  );
}

function ModeIcon({ mode }) {
  switch (mode) {
  case 'design':
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20l4-1 11-11a2 2 0 0 0 0-3l-0-0a2 2 0 0 0-3 0L5 16l-1 4z" />
      </svg>
    );
  case 'implement':
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 5l-5 7 5 7M16 5l5 7-5 7M13 4l-2 16" />
      </svg>
    );
  case 'simulate':
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
      </svg>
    );
  case 'test':
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6v4l4 8a4 4 0 0 1-4 6H9a4 4 0 0 1-4-6l4-8V3z" />
      </svg>
    );
  default:
    return null;
  }
}
