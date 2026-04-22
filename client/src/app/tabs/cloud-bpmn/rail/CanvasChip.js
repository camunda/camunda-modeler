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
 * CanvasChip — small floating label pinned above the canvas. Rendered per mode
 * when `modeConfig[mode].canvasChip` is set; currently used by Validate mode.
 *
 * Props:
 *   label    required  primary text ("Validate mode")
 *   hint     optional  secondary muted text — hidden once counts appear
 *   accent   optional  'test' | 'design' | 'implement' | 'simulate'
 *   counts   optional  { pass, fail, incident, notRun } — live badge summary
 *   actions  optional  array of { label, onClick } — rendered as inline links
 *   action   optional  legacy single { label, onClick } — still supported
 */
export default function CanvasChip({
  label,
  hint,
  accent = 'test',
  counts = null,
  actions = null,
  action = null
}) {
  const hasCounts = counts !== null && (
    counts.pass + counts.fail + counts.incident + counts.notRun
  ) > 0;
  const effectiveActions = actions || (action ? [ action ] : []);

  return (
    <div className={ `${css.chip} ${css['chip--' + accent]}` } role="status">
      <span className={ css.chipDot } aria-hidden="true" />
      <span className={ css.chipLabel }>{ label }</span>

      { hasCounts ? (
        <span className={ css.counts }>
          { counts.pass > 0 && (
            <span className={ `${css.count} ${css['count--pass']}` }>✓ { counts.pass }</span>
          ) }
          { counts.incident > 0 && (
            <span className={ `${css.count} ${css['count--incident']}` }>⚠ { counts.incident }</span>
          ) }
          { counts.fail > 0 && (
            <span className={ `${css.count} ${css['count--fail']}` }>✕ { counts.fail }</span>
          ) }
          { counts.notRun > 0 && (
            <span className={ css.countNotRun }>{ counts.notRun } not run</span>
          ) }
        </span>
      ) : hint ? (
        <span className={ css.chipHint }>{ hint }</span>
      ) : null }

      { effectiveActions.map((a, i) => (
        <button key={ i } type="button" className={ css.action } onClick={ a.onClick }>
          { a.label }
        </button>
      )) }
    </div>
  );
}
