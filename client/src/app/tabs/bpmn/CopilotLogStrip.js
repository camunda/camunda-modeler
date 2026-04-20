/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';

import classNames from 'classnames';

import CopilotActionLog from './CopilotActionLog';

import * as css from './GuidedStart.less';

export default function CopilotLogStrip({ entries, onEntryClick, onDismiss }) {
  const [ expanded, setExpanded ] = useState(true);
  if (!entries || entries.length === 0) return null;

  return (
    <div className={ classNames(css.copilotLogStrip, { [css.isCollapsed]: !expanded }) }>
      <div className={ css.copilotLogStripHeader }>
        <button
          type="button"
          className={ css.copilotLogStripToggle }
          onClick={ () => setExpanded(e => !e) }
        >
          { expanded ? '▾' : '▸' } AI draft — what was decided ({ entries.length } steps)
        </button>
        <button
          type="button"
          className={ css.copilotLogStripDismiss }
          onClick={ onDismiss }
          aria-label="Dismiss draft log"
        >✕</button>
      </div>
      { expanded && (
        <CopilotActionLog entries={ entries } interactive={ true } onEntryClick={ onEntryClick } />
      ) }
    </div>
  );
}
