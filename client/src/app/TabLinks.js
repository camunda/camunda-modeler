import React, { Component } from 'react';

import styled from 'styled-components';

const Container = styled.div`
  margin-top: 10px;
  flex: initial;
`;

const TabLink = styled.span`
  position: relative;
  margin-bottom: -1.5px;
  display: inline-block;
  min-width: 30px;
  margin-right: 5px;
  padding: 5px;
  text-align: center;
  border-top: solid 2px #ddd;
  border-right: solid 1px #ddd;
  border-left: solid 1px #ddd;
  border-radius: 2px 2px 0 0;
  background: #fff;
  cursor: default;

  &.active,
  &:hover {
    border-top: solid 2px #489d12;
    z-index: 2;
  }
`;

const Close = styled.span`
  display: inline-block;
  margin: -1px 0 1px 5px;
  padding: 0 2px;
  font-size: 18px;
  line-height: 9px;
  vertical-align: middle;
  width: 13px;
  padding: 2px 0 0 1px;

  &:before {
    content: '×';
  }

  &.dirty:not(:hover) {
    color: orange;
    margin: -3px 0 2px 5px;
    padding: 0;
    font-size: 22px;
    font-weight: bold;
  }

  &.dirty:not(:hover):before {
    content: '○';
  }
`;

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
      <Container className="tab-links">
        {tabs.map(tab => {
          const classes = ['tab-link'];

          if (tab === activeTab) {
            classes.push('active');
          }

          return (
            <TabLink
              key={ tab.id }
              className={ classes.join(' ') }
              onClick={ () => onSelect(tab) }
            >
              {tab.name}
              <Close
                className={ 'close'.concat(tab.dirty ? ' dirty' : '') }
                onClick={ e => {
                  e.preventDefault();
                  e.stopPropagation();

                  onClose(tab);
                } }
              />
            </TabLink>
          );
        })}
        <TabLink
          key="empty-tab"
          className={ 'tab-link'.concat(
            tabs.length ? '' : ' active'
          ) }
          onClick={ onCreate }
        >
          +
        </TabLink>
      </Container>
    );
  }
}