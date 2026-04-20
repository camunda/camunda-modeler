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

/**
 * Action log. Entries are read-only during generation (`interactive === false`)
 * and become clickable navigation anchors after the diagram is committed.
 */
export default function CopilotActionLog({ entries, interactive, onEntryClick }) {
  if (!entries || entries.length === 0) {
    return <div className={ css.copilotActionLog } aria-label="Action log (empty)" />;
  }

  return (
    <ul className={ css.copilotActionLog } aria-label="Action log">
      { entries.map((entry, i) => {
        const icon = BPMN_TYPE_ICON[entry.bpmnType] || 'bpmn-icon-task';
        const clickable = interactive && !!entry.elementId;
        return (
          <li
            key={ i }
            className={ classNames(css.copilotActionLogEntry, { [css.isClickable]: clickable }) }
          >
            <button
              type="button"
              disabled={ !clickable }
              onClick={ clickable ? () => onEntryClick(entry) : undefined }
            >
              <span className={ classNames(icon, css.copilotActionLogIcon) } aria-hidden="true" />
              <span className={ css.copilotActionLogText }>
                <span className={ css.copilotActionLogName }>{ entry.name || entry.elementId }</span>
                <span className={ css.copilotActionLogRationale }>{ entry.rationale }</span>
              </span>
            </button>
          </li>
        );
      }) }
    </ul>
  );
}
