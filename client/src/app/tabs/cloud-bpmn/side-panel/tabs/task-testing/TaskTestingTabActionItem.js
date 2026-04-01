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

import { Fill } from '../../../../../slot-fill';

import TaskTestingIcon from '../../../../../../../resources/icons/TaskTesting.svg';

import { DEFAULT_LAYOUT } from '../../../../../side-panel/SidePanel';

export default function TaskTestingTabActionItem(props) {
  const {
    onLayoutChanged,
    layout
  } = props;

  let { sidePanel: sidePanelLayout = DEFAULT_LAYOUT } = layout;

  sidePanelLayout = { ...DEFAULT_LAYOUT, ...sidePanelLayout };

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
    <button
      className={ classnames(
        'btn--tab-action',
        {
          'btn--active': sidePanelLayout.open && sidePanelLayout.tab === 'test'
        }
      ) }
      onClick={ onClick }
      title="Test"
    >
      <TaskTestingIcon />
    </button>
  </Fill>;
}
