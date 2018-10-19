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

});

function noop() {}

function renderTabLinks(options = {}) {
  const {
    activeTab,
    tabs,
    onSelect
  } = options;

  const tree = mount(
    <TabLinks
      activeTab={ activeTab || defaultActiveTab }
      tabs={ tabs || defaultTabs }
      onSelect={ onSelect || noop } />
  );

  const tabLinks = tree.instance();

  return {
    tree,
    tabLinks
  };
}