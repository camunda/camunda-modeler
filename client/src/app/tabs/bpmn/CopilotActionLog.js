/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import * as css from './GuidedStart.less';

const BPMN_TYPE_ICON = {
  'bpmn:StartEvent': 'bpmn-icon-start-event-none',
  'bpmn:EndEvent': 'bpmn-icon-end-event-none',
  'bpmn:UserTask': 'bpmn-icon-user-task',
  'bpmn:ServiceTask': 'bpmn-icon-service-task',
  'bpmn:Task': 'bpmn-icon-task',
  'bpmn:ExclusiveGateway': 'bpmn-icon-gateway-xor',
  'bpmn:ParallelGateway': 'bpmn-icon-gateway-parallel'
};

const BPMN_TYPE_LABEL = {
  'bpmn:StartEvent': 'Start event',
  'bpmn:EndEvent': 'End event',
  'bpmn:UserTask': 'User task',
  'bpmn:ServiceTask': 'Service task',
  'bpmn:Task': 'Task',
  'bpmn:ExclusiveGateway': 'Exclusive gateway',
  'bpmn:ParallelGateway': 'Parallel gateway'
};

function buildMeta(entry) {
  const parts = [];
  const typeLabel = BPMN_TYPE_LABEL[entry.bpmnType];
  if (typeLabel) parts.push(typeLabel);

  const fieldCount = Array.isArray(entry.substeps) ? entry.substeps.length : 0;
  if (fieldCount > 0) {
    parts.push(`${ fieldCount } ${ fieldCount === 1 ? 'field' : 'fields' }`);
  }
  return parts.join(' · ');
}

/**
 * Action log. Entries are read-only during generation (`interactive === false`)
 * and become clickable navigation anchors once playback completes. The first
 * time the log becomes interactive, the first row pulses once to draw the eye.
 *
 * Props:
 *   - entries: array of log entries
 *   - interactive: boolean — whether clicks are enabled
 *   - activeEntryIndex: index of the currently-open stepper entry, or null
 *   - onEntryClick: (entry, index) => void
 */
export default function CopilotActionLog({ entries, interactive, activeEntryIndex, onEntryClick }) {
  const [ pulsed, setPulsed ] = useState(false);
  const hasPulsedRef = useRef(false);

  // Fire the one-time pulse on the first row when the log transitions to
  // interactive (phase=READY). Only fires once per mount.
  useEffect(() => {
    if (interactive && !hasPulsedRef.current && entries && entries.length > 0) {
      hasPulsedRef.current = true;
      setPulsed(true);
      const t = setTimeout(() => setPulsed(false), 2400); // two 1.2s cycles
      return () => clearTimeout(t);
    }
  }, [ interactive, entries ]);

  if (!entries || entries.length === 0) {
    return <div className={ css.copilotActionLog } aria-label="Action log (empty)" />;
  }

  return (
    <ul className={ css.copilotActionLog } aria-label="Action log">
      { entries.map((entry, i) => {
        const icon = BPMN_TYPE_ICON[entry.bpmnType] || 'bpmn-icon-task';
        const clickable = interactive && !!entry.elementId;
        const isActive = activeEntryIndex === i;
        return (
          <li
            key={ i }
            className={ classNames(css.copilotActionLogEntry, {
              [css.isClickable]: clickable,
              [css.isActive]: isActive,
              [css.isPulsing]: pulsed && i === 0 && !isActive
            }) }
          >
            <button
              type="button"
              disabled={ !clickable }
              onClick={ clickable ? () => onEntryClick(entry, i) : undefined }
            >
              <span className={ css.copilotActionLogBullet } aria-hidden="true">
                { isActive ? '◉' : '○' }
              </span>
              <span className={ classNames(icon, css.copilotActionLogIcon) } aria-hidden="true" />
              <span className={ css.copilotActionLogText }>
                <span className={ css.copilotActionLogName }>{ entry.name || entry.elementId }</span>
                <span className={ css.copilotActionLogMeta }>{ buildMeta(entry) }</span>
              </span>
              { clickable && (
                <span className={ css.copilotActionLogChevron } aria-hidden="true">›</span>
              ) }
            </button>
          </li>
        );
      }) }
    </ul>
  );
}
