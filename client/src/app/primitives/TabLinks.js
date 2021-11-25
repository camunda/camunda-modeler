/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classNames from 'classnames';

import css from './Tabbed.less';

import {
  addDragger
} from '../util/dragger';

import TabCloseIcon from '../../../resources/icons/TabClose.svg';
import CircleIcon from '../../../resources/icons/Circle.svg';

const noop = () => {};

const TABS_OPTS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.active',
    ignore: '.ignore'
  }
};


export default class TabLinks extends PureComponent {
  constructor(props) {
    super(props);

    this.tabLinksRef = React.createRef();
  }

  componentDidMount() {
    const {
      draggable
    } = this.props;

    if (draggable) {
      addDragger(this.tabLinksRef.current, TABS_OPTS, this.handleDrag, this.handleDragStart);
    }
  }

  handleDragStart = ({ dragTab }) => {
    const {
      tabs,
      onSelect
    } = this.props;

    const tab = tabs.find(({ id }) => id === dragTab.dataset.tabId);

    onSelect(tab);
  }

  handleDrag = ({ dragTab, newIndex }) => {
    const {
      tabs,
      onMoveTab
    } = this.props;

    const tab = tabs.find(({ id }) => id === dragTab.dataset.tabId);

    onMoveTab(tab, newIndex);
  }

  isDirty = (tab) => {
    const {
      dirtyTabs,
      unsavedTabs
    } = this.props;

    return (dirtyTabs && !!dirtyTabs[ tab.id ]) ||
           (unsavedTabs && !!unsavedTabs[ tab.id ]);
  }

  render() {

    const {
      activeTab,
      tabs,
      onSelect,
      onContextMenu,
      onClose,
      placeholder,
      className
    } = this.props;

    return (
      <div
        className={ classNames(css.LinksContainer, className) }
        ref={ this.tabLinksRef }>
        <div className="tabs-container">
          {
            tabs.map(tab => {
              const dirty = this.isDirty(tab);

              return (
                <span
                  key={ tab.id }
                  data-tab-id={ tab.id }
                  title={ tab.title }
                  className={ classNames('tab', {
                    active: tab === activeTab,
                    dirty
                  }) }
                  onClick={ () => onSelect(tab, event) }
                  onContextMenu={ (event) => (onContextMenu || noop)(tab, event) }
                  draggable
                >
                  {tab.name}
                  {
                    onClose && <span
                      className="close"
                      title="Close Tab"
                      onClick={ e => {
                        e.preventDefault();
                        e.stopPropagation();

                        onClose(tab);
                      } }
                    >
                      {
                        dirty ? <CircleIcon className="icon dirty-icon" /> : null
                      }
                      <TabCloseIcon className="icon close-icon" />
                    </span>
                  }
                </span>
              );
            })
          }

          {
            placeholder && <span
              key="__placeholder"
              className={ classNames('tab placeholder ignore', {
                active: tabs.length === 0
              }) }
              onClick={ placeholder.onClick }
              title={ placeholder.title }
            >
              { placeholder.label }
            </span>
          }
        </div>
      </div>
    );
  }
}
