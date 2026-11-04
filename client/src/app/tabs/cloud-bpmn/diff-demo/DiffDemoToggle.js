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

import * as css from './DiffDemoToggle.css';

export const MODE_ORIGINAL = 'original';
export const MODE_MODIFIED = 'modified';

const OPTIONS = [
  { mode: MODE_ORIGINAL, label: 'Original' },
  { mode: MODE_MODIFIED, label: 'Modified', sparkle: true }
];

/**
 * PROTOTYPE: floating toggle that swaps the diagram XML between the original
 * and a modified version to demo properties panel diffing.
 *
 * @param {Object} props
 * @param {MODE_ORIGINAL|MODE_MODIFIED} props.mode
 * @param {Function} props.onModeChange
 */
export default function DiffDemoToggle({ mode, onModeChange }) {
  return (
    <div className={ css.DiffDemoToggle }>
      <div className="diff-demo-track" role="radiogroup" aria-label="Diagram version">
        <span className={ `diff-demo-indicator ${ mode === MODE_MODIFIED ? 'is-right' : '' }` } />
        { OPTIONS.map(option => (
          <button
            key={ option.mode }
            type="button"
            role="radio"
            aria-checked={ mode === option.mode }
            className={ `diff-demo-option ${ mode === option.mode ? 'is-active' : '' }` }
            onClick={ () => onModeChange(option.mode) }
          >
            { option.sparkle && <span className="diff-demo-sparkle" aria-hidden="true">✦</span> }
            { option.label }
          </button>
        )) }
      </div>
    </div>
  );
}
