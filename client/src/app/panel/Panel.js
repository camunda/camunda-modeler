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

import { Slot } from '../slot-fill';

import CloseIcon from '../../../resources/icons/Close.svg';

import * as css from './Panel.less';


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
  const activeTab = tabs.find(t => t.id === activeTabId) || {};

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
    <div className={ css.Panel }>
      <div className="panel__header">
        <div className="panel__links">
          {tabs.sort((a, b) => b.priority - a.priority).map(tab => (
            <button
              key={ tab.id }
              className={ classnames('panel__link', { 'panel__link--active': tab === activeTab }) }
              onClick={ () => onLayoutChanged({
                panel: {
                  ...panel,
                  tab: tab.id
                }
              }) }
            >
              {tab.link}
            </button>
          ))}
        </div>
        <div className="panel__actions">
          {activeTab.actions}
          <button key="close" className="panel__action" title="Close panel" onClick={ close }>
            <CloseIcon />
          </button>
        </div>
      </div>
      <div tabIndex="0" className="panel__body" onFocus={ updateMenu }>
        <div className="panel__inner">
          {activeTab.body}
        </div>
      </div>
      {
        children
      }
      <Slot name="bottom-panel" Component={ Tab } />
    </div>
  </TabContext.Provider>;
}

Panel.Tab = Tab;

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
          ? <span className="panel__link-number">{ number }</span>
          : null
      }
    </>;

    const Actions = (actions || []).map(action => {
      const Icon = action.icon;

      return <button key={ action.title } className="panel__action" title={ action.title } onClick={ action.onClick }>
        <Icon />
      </button>;
    });

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
