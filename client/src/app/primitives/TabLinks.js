import React, { Component } from 'react';

import classNames from 'classnames';

import { linksContainer } from './Tabbed.less';


export default class TabLinks extends Component {

  render() {

    const {
      activeTab,
      tabs,
      onSelect,
      onClose,
      onCreate,
      className
    } = this.props;

    console.log('%cTabLinks#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div className={ classNames(linksContainer, className) }>
        {tabs.map(tab => {

          return (
            <span
              key={ tab.id }
              className={ classNames('tab', {
                active: tab === activeTab,
                dirty: tab.dirty
              }) }
              onClick={ () => onSelect(tab) }
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
        })}

        {
          onCreate && <span
            key="empty-tab"
            className={ classNames('tab', {
              active: tabs.length === 0
            }) }
            onClick={ onCreate }
          >
            +
          </span>
        }
      </div>
    );
  }
}