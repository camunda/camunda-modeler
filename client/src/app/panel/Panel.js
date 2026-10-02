/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import classnames from 'classnames';

import { isDefined } from 'min-dash';

import {
  Badge,
  IconButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@camunda/design-system';

import { X } from '@camunda/design-system/icons';

import { Slot } from '../slot-fill';

import * as css from './Panel.css';


const TabContext = React.createContext({
  tabs: [],
  addTab: () => {},
  removeTab: () => {}
});

export default function Panel({ children, layout = {}, onLayoutChanged, onUpdateMenu }) {
  const { panel = {} } = layout;

  const updateMenu = useCallback(() => {
    const enabled = hasSelection();

    const editMenu = [
      [
        {
          role: 'undo',
          enabled: false
        },
        {
          role: 'redo',
          enabled: false
        },
      ],
      [
        {
          role: 'copy',
          enabled
        },
        {
          role: 'cut',
          enabled: false
        },
        {
          role: 'paste',
          enabled: false
        },
        {
          role: 'selectAll',
          enabled: false
        }
      ]
    ];

    onUpdateMenu({ editMenu });
  }, [ onUpdateMenu ]);

  const [ tabs, setTabs ] = useState([]);

  const { tab: activeTabId } = panel;
  const sortedTabs = [ ...tabs ].sort((a, b) => b.priority - a.priority);
  const activeTab = sortedTabs.find(t => t.id === activeTabId) || sortedTabs[ 0 ] || {};

  const contextValue = {
    tabs,
    addTab: (tab) => {
      setTabs(tabs => [ ...tabs, tab ]);
    },
    removeTab: (tab) => {
      setTabs(tabs => tabs.filter(t => t !== tab));
    }
  };

  const close = () => {
    onLayoutChanged({
      panel: {
        ...panel,
        open: false
      }
    });
  };

  return <TabContext.Provider value={ contextValue }>
    <Tabs
      className={ css.Panel }
      value={ activeTab.id }
      onValueChange={ (id) => onLayoutChanged({
        panel: {
          ...panel,
          tab: id
        }
      }) }
    >
      <div className="panel__header">
        <TabsList variant="line">
          {sortedTabs.map(tab => (
            <TabsTrigger
              key={ tab.id }
              value={ tab.id }
              className={ classnames('panel__link', { 'panel__link--active': tab === activeTab }) }
            >
              {tab.link}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="panel__actions">
          {activeTab.actions}
          <PanelAction title="Close panel" icon={ X } onClick={ close } />
        </div>
      </div>
      <div className="panel__body" onFocus={ updateMenu }>
        {
          isDefined(activeTab.id) && (
            <TabsContent value={ activeTab.id } className="panel__inner">
              {activeTab.body}
            </TabsContent>
          )
        }
      </div>
      {
        children
      }
      <Slot name="bottom-panel" Component={ Tab } />
    </Tabs>
  </TabContext.Provider>;
}

Panel.Tab = Tab;

function PanelAction({ title, icon, onClick }) {
  return (
    <IconButton
      variant="ghost"
      size="sm"
      className="panel__action"
      label={ title }
      icon={ icon }
      tooltipSide="top"
      onClick={ onClick }
    />
  );
}

function Tab(props) {
  const {
    actions,
    children,
    id,
    label,
    number,
    priority
  } = props;

  const { addTab, removeTab } = useContext(TabContext);

  const TabContent = useMemo(() => {
    const Link = <>
      <span className="panel__link-label">
        { label }
      </span>
      {
        isDefined(number)
          ? <Badge variant="neutral" className="panel__link-number">{ number }</Badge>
          : null
      }
    </>;

    const Actions = (actions || []).map(action => (
      <PanelAction
        key={ action.title }
        title={ action.title }
        icon={ action.icon }
        onClick={ action.onClick }
      />
    ));

    return {
      id: id || label,
      priority: priority || 0,
      link: Link,
      actions: Actions,
      body: children
    };
  }, [ actions, children, id, label, number, priority ]);

  useEffect(() => {
    addTab(TabContent);

    return () => {
      removeTab(TabContent);
    };
  }, [ TabContent ]);

  return null;
}


// helpers //////////

function hasSelection() {
  return window.getSelection().toString() !== '';
}
