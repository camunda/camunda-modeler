import React, { Component } from 'react';

import classNames from 'classnames';

import {
  debounce
} from 'min-dash';

import css from './Tabbed.less';

import {
  addScroller,
  removeScroller
} from '../util/scroller';

import {
  addDragger
} from '../util/dragger';

const noop = () => {};

const TABS_OPTS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.active',
    ignore: '.ignore'
  }
};


export default class TabLinks extends Component {
  constructor(props) {
    super(props);

    if (process.env.NODE_ENV !== 'test') {
      this.updateScroller = debounce(this.updateScroller, 300);
    }

    this.tabLinksRef = React.createRef();
  }

  componentDidMount() {
    const {
      draggable,
      scrollable
    } = this.props;

    if (draggable) {
      addDragger(this.tabLinksRef.current, TABS_OPTS, this.handleDrag);
    }

    if (scrollable) {
      this.scroller = addScroller(this.tabLinksRef.current, TABS_OPTS, this.handleScroll);
    }
  }

  componentWillUnmount() {
    if (this.scroller) {
      removeScroller(this.scroller);

      this.scroller = null;
    }
  }

  updateScroller() {
    if (this.scroller) {
      this.scroller.update();
    }
  }

  componentDidUpdate() {
    this.updateScroller();
  }

  handleScroll = (node) => {
    const {
      onSelect,
      tabs
    } = this.props;

    const tab = tabs.find(({ id }) => id === node.dataset.tabId);

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

  render() {

    const {
      activeTab,
      tabs,
      isDirty,
      onSelect,
      onContextMenu,
      onClose,
      onCreate,
      className
    } = this.props;

    return (
      <div
        className={ classNames(css.LinksContainer, className) }
        ref={ this.tabLinksRef }>
        <div className="tabs-container">
          {
            tabs.map(tab => {
              return (
                <span
                  key={ tab.id }
                  data-tab-id={ tab.id }
                  className={ classNames('tab', {
                    active: tab === activeTab,
                    dirty: isDirty && isDirty(tab)
                  }) }
                  onClick={ () => onSelect(tab, event) }
                  onContextMenu={ (event) => (onContextMenu || noop)(tab, event) }
                  draggable
                >
                  {tab.name}
                  {
                    onClose && <span
                      className="close"
                      onClick={ e => {
                        e.preventDefault();
                        e.stopPropagation();

                        onClose(tab);
                      } }
                    />
                  }
                </span>
              );
            })
          }

          {
            onCreate && <span
              key="empty-tab"
              className={ classNames('tab ignore', {
                active: tabs.length === 0
              }) }
              onClick={ () => onCreate() }
            >
              +
            </span>
          }
        </div>
      </div>
    );
  }
}