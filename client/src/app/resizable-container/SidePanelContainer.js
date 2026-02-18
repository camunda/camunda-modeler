/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { forwardRef, useCallback } from 'react';

import classnames from 'classnames';

import { Settings } from '@carbon/icons-react';

import ResizableContainer from './ResizableContainer';

import TaskTestingIcon from '../../../resources/icons/TaskTesting.svg';
import CloseIcon from '../../../resources/icons/Close.svg';

import SidePanelHeader from './SidePanelHeader';

import * as css from './SidePanelContainer.less';

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

export default forwardRef(function SidePanelContainer(props, ref) {
  const {
    layout,
    onLayoutChanged,
    testContent,
    injector
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
        ...sidePanel,
        open,
        width
      }
    });
  }, [ onLayoutChanged, sidePanel ]);

  const onTabClick = useCallback((tabId) => {
    if (tab === tabId && open) {

      // clicking the active tab closes the panel
      onLayoutChanged({
        sidePanel: {
          ...sidePanel,
          open: false
        }
      });
    } else {
      onLayoutChanged({
        sidePanel: {
          ...sidePanel,
          open: true,
          tab: tabId
        }
      });
    }
  }, [ onLayoutChanged, sidePanel, tab, open ]);

  const onClose = useCallback(() => {
    onLayoutChanged({
      sidePanel: {
        ...sidePanel,
        open: false
      }
    });
  }, [ onLayoutChanged, sidePanel ]);

  return (
    <ResizableContainer
      className={ `${css.SidePanelContainer} side-panel` }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
    >
      <div className="side-panel__title-bar">
        <div className="side-panel__title">
          <span>Element</span>
        </div>
        <div className="side-panel__actions">
          <button
            className="side-panel__action"
            title="Close panel"
            onClick={ onClose }
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <SidePanelHeader
        injector={ injector } />

      <div className="side-panel__tabs-bar">
        { TAB_ORDER.map(tabId => {
          const { label, icon: Icon } = TAB_CONFIG[tabId];
          return (
            <button
              key={ tabId }
              className={ classnames('side-panel__tab', {
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
          className={ classnames('side-panel__content', {
            'side-panel__content--active': tab === SIDE_PANEL_TABS.PROPERTIES
          }) }
        >
          <div className="properties-container" ref={ ref } />
        </div>
        <div
          className={ classnames('side-panel__content', {
            'side-panel__content--active': tab === SIDE_PANEL_TABS.TEST
          }) }
        >
          { testContent }
        </div>
      </div>
    </ResizableContainer>
  );
});
