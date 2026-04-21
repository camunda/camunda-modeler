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

import RailToolsSection from './RailToolsSection';
import RailShapesSection from './RailShapesSection';
import RailSearchButton from './RailSearchButton';
import RailModesSection from './RailModesSection';

import { RailTooltipProvider } from './RailTooltip';

import { useMode } from '../mode/modeController';

import * as css from './ModeRail.less';

/**
 * ModeRail — the new left-edge rail that replaces the bpmn-js default palette.
 * Composed of four stacked sections: Tools, Shapes, Search, Modes.
 *
 * Props:
 *   modeler          — the bpmn-js modeler instance (for tool/create calls)
 *   modeController   — shared observable mode store (see mode/modeController.js)
 *   onOpenPalette    — invoked by the search button to open the command palette
 */
export default function ModeRail(props) {
  const { modeler, modeController, onOpenPalette } = props;

  const { mode, setMode, config } = useMode(modeController);

  if (!modeler) return null;

  return (
    <RailTooltipProvider>
      <aside
        className={ `${css.rail} ${css['rail--mode-' + mode]}` }
        aria-label="Modeler tools and mode rail"
      >
        <RailToolsSection modeler={ modeler } />

        <div className={ css.divider } />

        <RailShapesSection
          modeler={ modeler }
          shapes={ config.visibleShapes }
          mode={ mode }
        />

        <div className={ css.divider } />

        <RailSearchButton onOpen={ onOpenPalette } />

        <div className={ css.spacer } />

        <RailModesSection
          mode={ mode }
          onSelect={ setMode }
        />
      </aside>
    </RailTooltipProvider>
  );
}
