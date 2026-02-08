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

import { DEFAULT_LAYOUT, SIDE_PANEL_TABS } from '../../SidePanel';

import * as css from './TaskTestingStatusBarItem.less';

export default function TestStatusBarItem(props) {
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
        open: !sidePanelLayout.open || sidePanelLayout.tab !== SIDE_PANEL_TABS.TEST,
        tab: SIDE_PANEL_TABS.TEST
      }
    });
  };

  return <Fill slot="status-bar__app" group="7_3_side_panel_test">
    <button
      className={ classnames(
        css.TestStatusBarItem,
        'btn',
        {
          'btn--active': sidePanelLayout.open && sidePanelLayout.tab === SIDE_PANEL_TABS.TEST
        }
      ) }
      onClick={ onClick }
      title="Test"
    >
      <TaskTestingIcon className="icon" />
    </button>
  </Fill>;
}
