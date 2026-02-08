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

import { Fill } from '../slot-fill';

import { Settings } from '@carbon/icons-react';

import { DEFAULT_LAYOUT, SIDE_PANEL_TABS } from '../tabs/cloud-bpmn/side-panel/SidePanel';

export default function PropertiesPanelStatusBarItem(props) {
  const {
    layout,
    onLayoutChanged
  } = props;

  let { sidePanel: sidePanelLayout = DEFAULT_LAYOUT } = layout;

  sidePanelLayout = { ...DEFAULT_LAYOUT, ...sidePanelLayout };

  const onClick = () => {
    onLayoutChanged({
      sidePanel: {
        ...sidePanelLayout,
        open: !sidePanelLayout.open || sidePanelLayout.tab !== SIDE_PANEL_TABS.PROPERTIES,
        tab: SIDE_PANEL_TABS.PROPERTIES
      }
    });
  };

  return <Fill slot="status-bar__app" group="7_2_side_panel_properties">
    <button
      className={ classnames(
        'btn',
        { 'btn--active': sidePanelLayout.open && sidePanelLayout.tab === SIDE_PANEL_TABS.PROPERTIES }
      ) }
      onClick={ onClick }
      title="Properties"
    >
      <Settings />
    </button>
  </Fill>;
}
