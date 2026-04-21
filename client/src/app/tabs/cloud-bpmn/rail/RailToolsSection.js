/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import * as css from './ModeRail.less';

/**
 * RailToolsSection — Hand / Lasso / Space / Global-connect.
 *
 * Each button activates the matching bpmn-js tool. We subscribe to
 * `tool-manager.update` so the "active tool" visual state follows any
 * activation, including keyboard shortcuts that bypass the rail.
 */
const TOOLS = [
  {
    id: 'hand',
    toolName: 'hand',
    label: 'Hand',
    shortcut: 'H',
    icon: HandIcon
  },
  {
    id: 'lasso',
    toolName: 'lasso',
    label: 'Lasso select',
    shortcut: 'L',
    icon: LassoIcon
  },
  {
    id: 'space',
    toolName: 'space',
    label: 'Space tool',
    shortcut: 'S',
    icon: SpaceIcon
  },
  {
    id: 'global-connect',
    toolName: 'global-connect',
    label: 'Connect',
    shortcut: 'C',
    icon: ConnectIcon
  }
];

export default function RailToolsSection({ modeler }) {
  const [ activeTool, setActiveTool ] = useState(null);

  useEffect(() => {
    if (!modeler) return undefined;

    const eventBus = modeler.get('eventBus');
    const handler = (event) => {
      setActiveTool(event && event.tool ? event.tool : null);
    };
    eventBus.on('tool-manager.update', handler);
    return () => eventBus.off('tool-manager.update', handler);
  }, [ modeler ]);

  const activate = (toolName) => {
    const toolManager = modeler.get('toolManager');

    // If user re-clicks the active tool, deactivate.
    if (activeTool === toolName) {
      toolManager.setActive(null);
      return;
    }
    toolManager.setActive(toolName);
  };

  return (
    <div className={ css.section } role="group" aria-label="Canvas tools">
      { TOOLS.map(tool => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.toolName;
        return (
          <button
            key={ tool.id }
            type="button"
            className={ `${css.button} ${isActive ? css['button--active'] : ''}` }
            title={ `${tool.label} (${tool.shortcut})` }
            aria-label={ tool.label }
            aria-pressed={ isActive }
            onClick={ () => activate(tool.toolName) }
          >
            <Icon />
          </button>
        );
      }) }
    </div>
  );
}

// ---- Simple inline SVG icons (24x24). Plain, monochrome — inherit currentColor.

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 11V5.5a1.5 1.5 0 1 1 3 0V11" />
      <path d="M11 11V4.5a1.5 1.5 0 1 1 3 0V11" />
      <path d="M14 11V5.5a1.5 1.5 0 1 1 3 0V14" />
      <path d="M17 11.5V9a1.5 1.5 0 0 1 3 0v7a5 5 0 0 1-5 5h-3c-3 0-4-2-5-4l-2-3c-.8-1.3.3-2.7 1.7-2l2.3 1.5V7.5a1.5 1.5 0 1 1 3 0V11" />
    </svg>
  );
}

function LassoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="9" rx="8" ry="5" strokeDasharray="2 2" />
      <path d="M7 14c0 2 2 4 5 4" />
      <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SpaceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M6 9l-3 3 3 3" />
      <path d="M18 9l3 3-3 3" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 8l8 8" />
    </svg>
  );
}
