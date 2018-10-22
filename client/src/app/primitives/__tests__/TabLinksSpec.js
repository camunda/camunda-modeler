/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import TabLinks from '../TabLinks';

import {
  defaultActiveTab,
  defaultTabs
} from './mocks';

const { spy } = sinon;


describe('<TabLinks>', function() {

  describe('scrolling', function() {

    it('should handle scroll', function() {

      // given
      const selectSpy = spy();

      const {
        tree,
        tabLinks
      } = renderTabLinks({
        onSelect: selectSpy
      });

      const node = tree.find('.tab[data-tab-id="tab2"]').getDOMNode();

      // when
      tabLinks.handleScroll(node);

      // then
      expect(selectSpy).to.have.been.calledWith(defaultTabs[1]);
    });

  });


  describe('dragging', function() {

    it('should handle drag', function() {

      // given
      const moveTabSpy = spy();

      const {
        tree,
        tabLinks
      } = renderTabLinks({
        onMoveTab: moveTabSpy
      });

      const node = tree.find('.tab[data-tab-id="tab2"]').getDOMNode();

      // when
      tabLinks.handleDrag({
        dragTab: node,
        newIndex: 0
      });

      // then
      expect(moveTabSpy).to.have.been.calledWith(defaultTabs[1], 0);
    });

  });

});

function noop() {}

function renderTabLinks(options = {}) {
  const {
    activeTab,
    tabs,
    onMoveTab,
    onSelect
  } = options;

  const tree = mount(
    <TabLinks
      activeTab={ activeTab || defaultActiveTab }
      tabs={ tabs || defaultTabs }
      onMoveTab={ onMoveTab || noop }
      onSelect={ onSelect || noop } />
  );

  const tabLinks = tree.instance();

  return {
    tree,
    tabLinks
  };
}