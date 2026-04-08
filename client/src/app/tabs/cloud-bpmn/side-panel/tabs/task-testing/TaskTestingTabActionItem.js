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

import { Fill } from '../../../../../slot-fill';

import { IconButton } from '@carbon/react';

import TaskTestingIcon from '../../../../../../../resources/icons/TaskTesting.svg';

import { DEFAULT_LAYOUT } from '../../../../../side-panel/SidePanel';

export default function TaskTestingTabActionItem(props) {
  const {
    onLayoutChanged,
    layout
  } = props;

  let { sidePanel: sidePanelLayout = DEFAULT_LAYOUT } = layout;

  sidePanelLayout = { ...DEFAULT_LAYOUT, ...sidePanelLayout };

  const isActive = sidePanelLayout.open && sidePanelLayout.tab === 'test';

  const onClick = () => {
    onLayoutChanged({
      sidePanel: {
        ...sidePanelLayout,
        open: !sidePanelLayout.open || sidePanelLayout.tab !== 'test',
        tab: 'test'
      }
    });
  };

  return <Fill slot="tab-actions" priority={ 1 }>
    <IconButton
      className="btn--tab-action"
      kind="ghost"
      size="sm"
      isSelected={ isActive }
      label="Test"
      onClick={ onClick }
    >
      <TaskTestingIcon />
    </IconButton>
  </Fill>;
}
