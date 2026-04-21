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

import * as css from './ModeRail.less';

/**
 * RailSearchButton — single button that opens the command palette. Keyboard
 * users get CMD+E directly; this is just the mouse affordance.
 */
export default function RailSearchButton({ onOpen }) {
  const isMac = typeof navigator !== 'undefined'
    && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const hint = isMac ? '⌘E' : 'Ctrl+E';

  return (
    <div className={ css.section } role="group" aria-label="Command palette">
      <button
        type="button"
        className={ `${css.button} ${css['button--search']}` }
        title={ `Search & commands (${hint})` }
        aria-label="Open command palette"
        onClick={ onOpen }
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
      </button>
    </div>
  );
}
