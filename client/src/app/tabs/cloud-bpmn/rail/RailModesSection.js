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

import {
  Pen,
  Code,
  PlayFilledAlt,
  CheckmarkOutline
} from '@carbon/icons-react';

import modeConfig, { MODES } from '../mode/modeConfig';

import { useRailTooltipAnchor } from './RailTooltip';

import * as css from './ModeRail.less';

/**
 * RailModesSection — four vertically-stacked mode chips (Design / Implement /
 * Simulate / Test). Active chip gets a colored band derived from the mode's
 * themeClass. Tooltip includes the keyboard hint.
 */
export default function RailModesSection({ mode, onSelect }) {
  const isMac = typeof navigator !== 'undefined'
    && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <div
      className={ css.modesSection }
      role="tablist"
      aria-label="Editor mode"
    >
      { MODES.map(m => {
        const cfg = modeConfig[m];
        const isActive = m === mode;
        return (
          <ModeButton
            key={ m }
            modeId={ m }
            cfg={ cfg }
            isActive={ isActive }
            hotkey={ `${modKey}${cfg.hotkey}` }
            onSelect={ () => onSelect(m) }
          />
        );
      }) }
    </div>
  );
}

function ModeButton({ modeId, cfg, isActive, hotkey, onSelect }) {
  const tooltipProps = useRailTooltipAnchor({
    label: `${cfg.label} mode`,
    hotkey
  });

  return (
    <button
      type="button"
      role="tab"
      aria-selected={ isActive }
      className={ `${css.modeButton} ${css['modeButton--' + modeId]} ${isActive ? css['modeButton--active'] : ''}` }
      { ...tooltipProps }
      onClick={ onSelect }
    >
      <ModeIcon mode={ modeId } />
      <span className={ css.modeLabel }>{ cfg.label }</span>
    </button>
  );
}

function ModeIcon({ mode }) {

  // Carbon icons — already used throughout the editor, so modelers see
  // familiar iconography rather than bespoke rail-only glyphs.
  const props = { size: 18, 'aria-hidden': true };

  switch (mode) {
  case 'design':
    return <Pen { ...props } />;
  case 'implement':
    return <Code { ...props } />;
  case 'simulate':
    return <PlayFilledAlt { ...props } />;
  case 'test':
    return <CheckmarkOutline { ...props } />;
  default:
    return null;
  }
}
