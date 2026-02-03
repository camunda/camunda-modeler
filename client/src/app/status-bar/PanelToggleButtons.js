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

import { Fill } from '../slot-fill';

import {
  Db2Database,
  SettingsAdjust,
  Chemistry,
  SidePanelClose,
  RightPanelClose
} from '@carbon/icons-react';

import classnames from 'classnames';

import * as css from './PanelToggleButtons.less';

export default function PanelToggleButtons(props) {
  const {
    layout,
    maxSidePanels,
    hideAllPanels,
    onToggleMaxSidePanels,
    onToggleHideAllPanels,
    onTogglePanel
  } = props;

  const variablesOpen = layout?.variables?.open !== false;
  const propertiesOpen = layout?.propertiesPanel?.open !== false;
  const testOpen = layout?.test?.open !== false;

  return (
    <Fill slot="status-bar__app" group="8_panels">
      <div className={ css.PanelToggleButtons }>
        <button
          className={ classnames('btn', { 'btn--active': maxSidePanels }) }
          onClick={ onToggleMaxSidePanels }
          title="Maximize all panels"
        >
          <SidePanelClose width={ 16 } height={ 16 } />
        </button>
        
        <button
          className={ classnames('btn', { 'btn--active': variablesOpen && !hideAllPanels }) }
          onClick={ () => onTogglePanel('variables') }
          title="Toggle variables panel"
          disabled={ hideAllPanels }
        >
          <Db2Database width={ 16 } height={ 16 } />
        </button>

        <button
          className={ classnames('btn', { 'btn--active': propertiesOpen && !hideAllPanels }) }
          onClick={ () => onTogglePanel('propertiesPanel') }
          title="Toggle properties panel"
          disabled={ hideAllPanels }
        >
          <SettingsAdjust width={ 16 } height={ 16 } />
        </button>

        <button
          className={ classnames('btn', { 'btn--active': testOpen && !hideAllPanels }) }
          onClick={ () => onTogglePanel('test') }
          title="Toggle test panel"
          disabled={ hideAllPanels }
        >
          <Chemistry width={ 16 } height={ 16 } />
        </button>

        <button
          className={ classnames('btn', { 'btn--active': hideAllPanels }) }
          onClick={ onToggleHideAllPanels }
          title={ hideAllPanels ? 'Show all panels' : 'Hide all panels' }
        >
          <RightPanelClose width={ 16 } height={ 16 } />
        </button>
      </div>
    </Fill>
  );
}
