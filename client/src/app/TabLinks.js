import React, { Component } from 'react';

import classNames from 'classnames';

import style from './TabLinks.less';


export default class TabLinks extends Component {

  render() {

    const {
      activeTab,
      tabs,
      onSelect,
      onClose,
      onCreate
    } = this.props;

    console.log('%cTabLinks#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div className={ style.TabLinks }>
        {tabs.map(tab => {

          return (
            <span
              key={ tab.id }
              className={ classNames('tab-link', {
                active: tab === activeTab,
                dirty: tab.dirty
              }) }
              onClick={ () => onSelect(tab) }
            >
              {tab.name}
              <span
                className="close"
                onClick={ e => {
                  e.preventDefault();
                  e.stopPropagation();

                  onClose(tab);
                } }
              />
            </span>
          );
        })}

        <span
          key="empty-tab"
          className={ classNames('tab-link', {
            active: tabs.length === 0
          }) }
          onClick={ onCreate }
        >
          +
        </span>
      </div>
    );
  }
}