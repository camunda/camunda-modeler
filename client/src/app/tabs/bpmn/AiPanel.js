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

import * as css from './GuidedStart.less';


const AI_OPTIONS = [
  {
    id: 'describe',
    icon: '✏️',
    label: 'Describe your process',
    description: 'Explain what the process should do in plain language — AI generates the initial flow.'
  },
  {
    id: 'pattern',
    icon: '📋',
    label: 'Start from a pattern',
    description: 'Pick a common process template — approval, onboarding, incident response — as a starting point.'
  },
  {
    id: 'improve',
    icon: '✦',
    label: 'Improve the current diagram',
    description: 'Let AI review what you have and suggest additions, simplifications, or missing error paths.'
  },
  {
    id: 'ask',
    icon: '💬',
    label: 'Ask a modeling question',
    description: 'Not sure how to model something in BPMN? Get guidance without leaving the canvas.'
  }
];


/**
 * Standalone AI assistance panel — rendered as a separate side panel,
 * not a tab inside the properties panel.
 *
 * @param {object} props
 * @param {function} props.onClose
 */
export default function AiPanel({ onClose }) {
  return (
    <div className={ css.aiSidePanel }>
      <div className={ css.aiSidePanelHeader }>
        <span className={ css.aiSidePanelTitle }>✦  AI assistance</span>
        <button
          className={ css.aiSidePanelClose }
          onClick={ onClose }
          aria-label="Close AI panel"
        >✕</button>
      </div>

      <div className={ css.aiSidePanelBody }>
        <p className={ css.aiSidePanelIntro }>What would you like to do?</p>

        <ul className={ css.aiOptionList }>
          { AI_OPTIONS.map(({ id, icon, label, description }) => (
            <li key={ id } className={ css.aiOption }>
              <span className={ css.aiOptionIcon }>{ icon }</span>
              <span className={ css.aiOptionText }>
                <span className={ css.aiOptionLabel }>{ label }</span>
                <span className={ css.aiOptionDesc }>{ description }</span>
              </span>
            </li>
          )) }
        </ul>

        <div className={ css.aiSidePanelFooter }>
          <p>⚡ Available in <strong>Web Modeler</strong> today</p>
          <p>📅 Coming to Desktop Modeler in <strong>8.10</strong></p>
        </div>
      </div>
    </div>
  );
}
