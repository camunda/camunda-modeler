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

import classnames from 'classnames';

import { Fill } from '../../../slot-fill';

import { Settings } from '@carbon/icons-react';

import { SIDE_PANEL_TABS } from '../../../resizable-container/SidePanelContainer';

export default function PropertiesPanelStatusBarItem(props) {
  const {
    onToggle,
    layout
  } = props;

  const { sidePanel = {} } = layout;

  return <Fill slot="status-bar__app" group="7_2_side_panel_properties">
    <button
      className={ classnames(
        'btn',
        { 'btn--active': sidePanel.open && sidePanel.tab === SIDE_PANEL_TABS.PROPERTIES }
      ) }
      onClick={ onToggle }
      title="Properties"
    >
      <Settings />
    </button>
  </Fill>;
}
