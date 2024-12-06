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

import * as css from './Tabbed.less';

import {
  addDragger
} from '../util/dragger';

import { TabActions } from '../tab-actions';

import TabCloseIcon from '../../../resources/icons/TabClose.svg';

const noop = () => {};

const TABS_OPTS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.tab--active',
    ignore: '.tab--ignore'
  }
};

const MIDDLE_MOUSE_BUTTON = 1;

/**
 * markers to indicate a tab has less width than
 * a defined threshold
 *
 * a) 90px => small
 * b) 45px => even smaller
 */
const SMALL_TAB_WIDTH = 90;
const SMALLER_TAB_WIDTH = 45;


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
  };

  handleDrag = ({ dragTab, newIndex }) => {
    const {
      tabs,
      onMoveTab
    } = this.props;

    const tab = tabs.find(({ id }) => id === dragTab.dataset.tabId);

    onMoveTab(tab, newIndex);
  };

  render() {

    const {
      activeTab,
      tabs,
      getTabIcon,
      onSelect,
      onContextMenu,
      onClose,
      placeholder,
      className,
      isDirty = () => false
    } = this.props;

    return (
      <div
        className={ classNames(css.LinksContainer, className) }
        ref={ this.tabLinksRef }>
        <div className="tabs-container">
          {
            tabs.map(tab => {
              const dirty = isDirty(tab);
              const active = tab === activeTab;

              return (
                <Tab
                  key={ tab.id }
                  tab={ tab }
                  active={ active }
                  dirty={ dirty }
                  getTabIcon={ getTabIcon }
                  onClose={ onClose }
                  onContextMenu={ onContextMenu }
                  onSelect={ onSelect }
                />
              );
            })
          }

          {
            placeholder && <div
              key="__placeholder"
              className={ classNames('tab tab--ignore tab--placeholder', {
                'tab--active': tabs.length === 0
              }) }
              onClick={ placeholder.onClick }
              title={ placeholder.title }
            >
              <span className="tab__content tab__name">
                { placeholder.label }
              </span>
            </div>
          }
        </div>

        <TabActions />
      </div>
    );
  }
}

function Tab(props) {
  const {
    active,
    dirty,
    getTabIcon,
    onClose,
    onContextMenu,
    onSelect,
    tab
  } = props;

  const tabRef = React.useRef(0);
  const [ small, setSmall ] = React.useState(false);
  const [ smaller, setSmaller ] = React.useState(false);

  const tabNode = tabRef.current;

  React.useEffect(() => {
    if (!tabNode) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const width = tabNode.getBoundingClientRect().width;
      setSmall(width < SMALL_TAB_WIDTH);
      setSmaller(width < SMALLER_TAB_WIDTH);
    });

    resizeObserver.observe(tabNode);
    return () => resizeObserver.disconnect();
  }, [ tabNode ]);

  return (
    <div
      tabIndex="0"
      ref={ tabRef }
      data-tab-id={ tab.id }
      title={ getTitleTag(tab, dirty) }
      className={ classNames('tab', {
        'tab--active': active,
        'tab--dirty': dirty,
        'tab--small': small,
        'tab--smaller': smaller
      }) }
      onClick={ (event) => onSelect(tab, event) }
      onAuxClick={ (event) => {
        if (event.button === MIDDLE_MOUSE_BUTTON) {
          event.preventDefault();
          event.stopPropagation();

          onClose && onClose(tab);
        }
      } }
      onContextMenu={ (event) => (onContextMenu || noop)(tab, event) }
      draggable
    >
      <div className="tab__content">
        <TabType tab={ tab } getTabIcon={ getTabIcon } />
        {
          dirty && <TabDirty />
        }
        <p className="tab__name">{tab.name}</p>
        {
          (active || !small) && (
            <TabClose
              tab={ tab }
              dirty={ dirty }
              onClose={ onClose } />
          )
        }
      </div>
    </div>
  );
}

function TabType(props) {
  const {
    getTabIcon,
    tab
  } = props;

  const IconComponent = getTabIcon(tab);

  return (
    <span className="tab__type">
      { IconComponent && <IconComponent /> }
    </span>
  );
}

function TabClose(props) {
  const {
    onClose,
    tab
  } = props;

  return (
    <button
      className="tab__close"
      title="Close tab"
      onClick={ (event) => {
        event.preventDefault();
        event.stopPropagation();

        onClose && onClose(tab);
      } }
    >
      <TabCloseIcon className="tab__icon-close" />
    </button>
  );
}

function TabDirty() {
  return (
    <span className="tab__dirty-marker"></span>
  );
}


// helper //////////

function getTitleTag(tab, dirty) {
  const {
    file,
    title
  } = tab;

  return title + (dirty || (file && !file.path) ? ' - unsaved' : '');
}
