/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback } from 'react';

import classNames from 'classnames';

import { Settings } from '@carbon/icons-react';

import ResizableContainer from '../../../resizable-container/ResizableContainer';

import TaskTestingTab from './tabs/task-testing/TaskTestingTab';
import TaskTestingIcon from '../../../../../resources/icons/TaskTesting.svg';

import SidePanelHeader from './SidePanelHeader';

import * as css from './SidePanel.less';

export const SIDE_PANEL_TABS = {
  VARIABLES: 'variables',
  PROPERTIES: 'properties',
  TEST: 'test'
};

export const VARIABLES_PANEL_TABS = {
  VARIABLES: 'variables'
};

export const MIN_WIDTH = 280;
export const MAX_WIDTH = MIN_WIDTH * 3;

export const DEFAULT_OPEN = true;
export const DEFAULT_WIDTH = 280;
export const DEFAULT_TAB = SIDE_PANEL_TABS.PROPERTIES;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH,
  tab: DEFAULT_TAB
};

const TAB_CONFIG = {
  [SIDE_PANEL_TABS.PROPERTIES]: { label: 'Properties', icon: Settings },
  [SIDE_PANEL_TABS.TEST]: { label: 'Test', icon: TaskTestingIcon }
};

const TAB_ORDER = [
  SIDE_PANEL_TABS.PROPERTIES,
  SIDE_PANEL_TABS.TEST
];

export default function SidePanel(props) {
  const {
    injector,
    layout,
    onLayoutChanged,
    propertiesPanelRef
  } = props;

  const { sidePanel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH,
    tab = DEFAULT_TAB
  } = sidePanel;

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      sidePanel: {
        ...DEFAULT_LAYOUT,
        ...sidePanel,
        open,
        width
      }
    });
  }, [ onLayoutChanged, sidePanel ]);

  const onTabClick = useCallback((tabId) => {
    if (tab === tabId && open) {
      onLayoutChanged({
        sidePanel: {
          ...DEFAULT_LAYOUT,
          ...sidePanel,
          open: false
        }
      });
    } else {
      onLayoutChanged({
        sidePanel: {
          ...DEFAULT_LAYOUT,
          ...sidePanel,
          open: true,
          tab: tabId
        }
      });
    }
  }, [ onLayoutChanged, sidePanel, tab, open ]);

  return (
    <ResizableContainer
      className={ classNames(css.SidePanel, 'side-panel') }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
    >
      <SidePanelHeader injector={ injector } />

      <div className="side-panel__tabs-bar">
        { TAB_ORDER.map(tabId => {
          const { label, icon: Icon } = TAB_CONFIG[tabId];
          return (
            <button
              key={ tabId }
              className={ classNames('side-panel__tab', {
                'side-panel__tab--active': tab === tabId
              }) }
              onClick={ () => onTabClick(tabId) }
              title={ label }
            >
              <Icon className="side-panel__tab-icon" />
              <span>{ label }</span>
            </button>
          );
        }) }
      </div>

      <div className="side-panel__body">
        <div
          className={ classNames('side-panel__content', {
            'side-panel__content--active': tab === SIDE_PANEL_TABS.PROPERTIES
          }) }
        >
          <div className="properties-container" ref={ propertiesPanelRef } />
        </div>
        <div
          className={ classNames('side-panel__content', {
            'side-panel__content--active': tab === SIDE_PANEL_TABS.TEST
          }) }
        >
          <TaskTestingTab
            config={ props.config }
            deployment={ props.deployment }
            file={ props.file }
            id={ props.id }
            injector={ injector }
            layout={ layout }
            onAction={ props.onAction }
            startInstance={ props.startInstance }
            zeebeApi={ props.zeebeApi }
          />
        </div>
      </div>
    </ResizableContainer>
  );
}
