/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useMemo } from 'react';

import classNames from 'classnames';

import ResizableContainer from '../resizable-container/ResizableContainer';

import * as css from './SidePanel.less';

export const MIN_WIDTH = 280;
export const MAX_WIDTH = MIN_WIDTH * 3;

export const DEFAULT_OPEN = true;
export const DEFAULT_WIDTH = MIN_WIDTH;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH
};


/**
 * A generic side panel component with optional tabs and header.
 *
 * @example <caption>Single tab</caption>
 *
 * ```jsx
 * <SidePanel layout={layout} onLayoutChanged={onLayoutChanged}>
 *   <SidePanel.Tab id="properties" label="Properties" icon={Settings}>
 *     <PropertiesTab propertiesPanelRef={propertiesPanelRef} />
 *   </SidePanel.Tab>
 * </SidePanel>
 * ```
 *
 * @example <caption>Multiple tabs with header</caption>
 *
 * ```jsx
 * <SidePanel layout={layout} onLayoutChanged={onLayoutChanged}>
 *   <SidePanel.Header>
 *     <SidePanelHeader injector={injector} />
 *   </SidePanel.Header>
 *   <SidePanel.Tab id="properties" label="Properties" icon={Settings}>
 *     <PropertiesTab propertiesPanelRef={propertiesPanelRef} />
 *   </SidePanel.Tab>
 *   <SidePanel.Tab id="test" label="Test" icon={TaskTestingIcon}>
 *     <TestTab config={config} ... />
 *   </SidePanel.Tab>
 * </SidePanel>
 * ```
 */
export default function SidePanel(props) {
  const {
    children,
    layout,
    onLayoutChanged
  } = props;

  const { sidePanel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH,
    tab
  } = sidePanel;

  const { headers, tabs } = useMemo(() => {
    const headers = [];
    const tabs = [];

    React.Children.forEach(children, child => {
      if (!child) {
        return;
      }

      if (child.type === Header) {
        headers.push(child);
      } else if (child.type === Tab) {
        tabs.push({
          id: child.props.id,
          label: child.props.label,
          icon: child.props.icon,
          content: child.props.children
        });
      }
    });

    return { headers, tabs };
  }, [ children ]);

  const showTabs = tabs.length > 1;

  const activeTabId = showTabs
    ? (tabs.some(t => t.id === tab) ? tab : tabs[0]?.id)
    : tabs[0]?.id;

  useEffect(() => {
    if (activeTabId && tab !== undefined && activeTabId !== tab) {
      onLayoutChanged({
        sidePanel: {
          ...DEFAULT_LAYOUT,
          ...sidePanel,
          tab: activeTabId
        }
      });
    }
  }, [ activeTabId, tab, onLayoutChanged, sidePanel ]);

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      sidePanel: {
        ...DEFAULT_LAYOUT,
        ...sidePanel,
        tab: activeTabId,
        open,
        width
      }
    });
  }, [ activeTabId, onLayoutChanged, sidePanel ]);

  const onTabClick = useCallback((tabId) => {
    if (tab === tabId && open) {
      return;
    }

    onLayoutChanged({
      sidePanel: {
        ...DEFAULT_LAYOUT,
        ...sidePanel,
        open: true,
        tab: tabId
      }
    });
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
      { headers }

      { showTabs && (
        <div className="side-panel__tabs-bar">
          { tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={ tabId }
              className={ classNames('side-panel__tab', {
                'side-panel__tab--active': activeTabId === tabId
              }) }
              onClick={ () => onTabClick(tabId) }
              title={ label }
            >
              { Icon && <Icon className="side-panel__tab-icon" /> }
              <span>{ label }</span>
            </button>
          )) }
        </div>
      ) }

      <div className="side-panel__body">
        { tabs.map(({ id: tabId, content }) => (
          <div
            key={ tabId }
            className={ classNames('side-panel__content', {
              'side-panel__content--active': activeTabId === tabId
            }) }
          >
            { content }
          </div>
        )) }
      </div>
    </ResizableContainer>
  );
}


function Header({ children }) {
  return children;
}

function Tab() {
  return null;
}

SidePanel.Header = Header;
SidePanel.Tab = Tab;
