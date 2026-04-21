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

import { useRailTooltipAnchor } from './RailTooltip';

import * as css from './ModeRail.less';

/**
 * RailToolsSection — Hand / Lasso / Space / Global-connect.
 *
 * Each button activates the matching bpmn-js tool. We subscribe to
 * `tool-manager.update` so the "active tool" visual state follows any
 * activation, including keyboard shortcuts that bypass the rail.
 *
 * Icons reuse the bpmn-js icon-font glyphs (imported globally). The
 * `global-connect` tool has no icon-font equivalent, so we keep a small
 * inline SVG for that one case.
 */
const TOOLS = [
  {
    id: 'hand',
    toolName: 'hand',
    label: 'Hand',
    shortcut: 'H',
    iconClass: 'bpmn-icon-hand-tool'
  },
  {
    id: 'lasso',
    toolName: 'lasso',
    label: 'Lasso select',
    shortcut: 'L',
    iconClass: 'bpmn-icon-lasso-tool'
  },
  {
    id: 'space',
    toolName: 'space',
    label: 'Space tool',
    shortcut: 'S',
    iconClass: 'bpmn-icon-space-tool'
  },
  {
    id: 'global-connect',
    toolName: 'global-connect',
    label: 'Connect',
    shortcut: 'C',
    iconClass: null,
    renderIcon: () => <ConnectIcon />
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
      { TOOLS.map(tool => (
        <ToolButton
          key={ tool.id }
          tool={ tool }
          isActive={ activeTool === tool.toolName }
          onActivate={ () => activate(tool.toolName) }
        />
      )) }
    </div>
  );
}

function ToolButton({ tool, isActive, onActivate }) {
  const tooltipProps = useRailTooltipAnchor({
    label: tool.label,
    hotkey: tool.shortcut
  });

  return (
    <button
      type="button"
      className={ `${css.button} ${isActive ? css['button--active'] : ''}` }
      aria-label={ tool.label }
      aria-pressed={ isActive }
      { ...tooltipProps }
      onClick={ onActivate }
    >
      { tool.iconClass
        ? <span className={ tool.iconClass } aria-hidden="true" />
        : tool.renderIcon()
      }
    </button>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 8l8 8" />
    </svg>
  );
}
