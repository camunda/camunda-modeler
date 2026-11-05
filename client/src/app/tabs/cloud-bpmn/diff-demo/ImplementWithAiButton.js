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

import * as css from './ImplementWithAiButton.css';

export const STATE_IDLE = 'idle';
export const STATE_WORKING = 'working';
export const STATE_DONE = 'done';

const LABELS = {
  [ STATE_IDLE ]: 'Implement with AI',
  [ STATE_WORKING ]: 'Implementing…',
  [ STATE_DONE ]: 'Implemented with AI'
};

/**
 * PROTOTYPE: floating button letting "AI" change the task in the diagram.
 *
 * @param {Object} props
 * @param {STATE_IDLE|STATE_WORKING|STATE_DONE} props.state
 * @param {Function} props.onClick
 */
export default function ImplementWithAiButton({ state = STATE_IDLE, onClick }) {
  return (
    <div className={ css.ImplementWithAiButton }>
      <button
        type="button"
        className="diff-demo-ai-button"
        disabled={ state !== STATE_IDLE }
        onClick={ onClick }
      >
        <span className="diff-demo-sparkle" aria-hidden="true">✦</span>
        { LABELS[ state ] }
      </button>
    </div>
  );
}
