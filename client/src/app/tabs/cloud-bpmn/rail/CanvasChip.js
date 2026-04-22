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

import * as css from './CanvasChip.less';

/**
 * CanvasChip — small floating label used by Test mode (e.g. "Test mode — click
 * a task to run it"). Appears top-center above the canvas, below any tab bar.
 */
export default function CanvasChip({ label, hint, accent = 'test', action = null }) {
  return (
    <div className={ `${css.chip} ${css['chip--' + accent]}` } role="status">
      <span className={ css.chipDot } aria-hidden="true" />
      <span className={ css.chipLabel }>{ label }</span>
      { hint && <span className={ css.chipHint }>{ hint }</span> }
      { action && action.label ? (
        <button type="button" className={ css.action } onClick={ action.onClick }>
          { action.label }
        </button>
      ) : null }
    </div>
  );
}
