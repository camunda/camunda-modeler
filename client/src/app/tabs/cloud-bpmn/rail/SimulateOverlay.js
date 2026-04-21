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
import * as css2 from './SimulateOverlay.less';

/**
 * SimulateOverlay — honest placeholder when the user enters Simulate mode.
 * No fake tokens, no pretend playback. Just an acknowledgement and a way out.
 */
export default function SimulateOverlay({ config, onExit }) {
  return (
    <div className={ css2.overlayRoot } role="dialog" aria-label="Token simulation">
      <div className={ css2.overlayCard }>
        <div className={ css2.overlayIcon }>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h3 className={ css2.overlayTitle }>{ config.title }</h3>
        <p className={ css2.overlayBody }>{ config.body }</p>
        <div className={ css2.overlayActions }>
          <button
            type="button"
            className={ `${css.button} ${css2.overlayActionPrimary}` }
            onClick={ () => onExit('design') }
          >
            Back to Design
          </button>
          <button
            type="button"
            className={ `${css.button} ${css2.overlayActionSecondary}` }
            onClick={ () => onExit('implement') }
          >
            Switch to Implement
          </button>
        </div>
      </div>
    </div>
  );
}
