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

import { IconButton } from '@carbon/react';
import { Settings } from '@carbon/icons-react';

import { DEFAULT_LAYOUT } from '../side-panel/SidePanel';

export default function PropertiesPanelTabActionItem(props) {
  const {
    layout,
    onLayoutChanged
  } = props;

  let { sidePanel: sidePanelLayout = DEFAULT_LAYOUT } = layout;

  sidePanelLayout = { ...DEFAULT_LAYOUT, ...sidePanelLayout };

  const isActive = sidePanelLayout.open && sidePanelLayout.tab === 'properties';

  const onClick = () => {
    onLayoutChanged({
      sidePanel: {
        ...sidePanelLayout,
        open: !sidePanelLayout.open || sidePanelLayout.tab !== 'properties',
        tab: 'properties'
      }
    });
  };

  return <Fill slot="tab-actions" priority={ 2 }>
    <IconButton
      className="btn--tab-action"
      kind="ghost"
      size="sm"
      isSelected={ isActive }
      label="Properties"
      onClick={ onClick }
    >
      <Settings />
    </IconButton>
  </Fill>;
}
