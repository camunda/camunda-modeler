/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import TabLinks from '../TabLinks';

import {
  defaultActiveTab,
  defaultTabs
} from './mocks';

const [
  tab1,
  tab2,
  tab3,
  tab4
] = defaultTabs;

const { spy } = sinon;


describe('<TabLinks>', function() {

  describe('dirty state', function() {

    it('should be dirty if dirty OR unsaved', function() {

      // given
      const {
        tabLinks
      } = renderTabLinks({
        dirtyTabs: {
          tab1: false,
          tab2: false,
          tab3: true,
          tab4: true
        },
        unsavedTabs: {
          tab1: false,
          tab2: true,
          tab3: false,
          tab4: true
        }
      });

      // when
      const tab1Dirty = tabLinks.isDirty(tab1),
            tab2Dirty = tabLinks.isDirty(tab2),
            tab3Dirty = tabLinks.isDirty(tab3),
            tab4Dirty = tabLinks.isDirty(tab4);

      // then
      expect(tab1Dirty).to.be.false;
      expect(tab2Dirty).to.be.true;
      expect(tab3Dirty).to.be.true;
      expect(tab4Dirty).to.be.true;
    });

  });


  describe('title', function() {

    it('should display tab title', function() {

      const {
        tree
      } = renderTabLinks();

      // when
      const node = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      // then
      expect(node.title).to.eql(tab1.title);
    });

  });


  describe('placeholder', function() {

    it('should display empty tab handle', function() {

      const clickSpy = spy();

      const placeholder = {
        onClick: clickSpy,
        title: 'CREATE STUFF',
        label: '+'
      };

      const {
        tree
      } = renderTabLinks({ placeholder });

      // when
      const tab = tree.find('.tab.placeholder');

      // then
      expect(tab.exists()).to.be.true;

      // and when
      tab.simulate('click');

      // then
      expect(clickSpy).to.have.been.calledOnce;
    });


    it('should hide empty tab handle', function() {

      const {
        tree
      } = renderTabLinks();

      // when
      const tab = tree.find('.tab.placeholder');

      // then
      expect(tab.exists()).to.be.false;
    });

  });


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

    it('should handle dragstart', function() {

      // given
      const onSelectSpy = spy();

      const {
        tree,
        tabLinks
      } = renderTabLinks({
        onSelect: onSelectSpy
      });

      const node = tree.find('.tab[data-tab-id="tab2"]').getDOMNode();

      // when
      tabLinks.handleDragStart({
        dragTab: node
      });

      // then
      expect(onSelectSpy).to.have.been.calledWith(defaultTabs[1]);
    });


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
    onSelect,
    dirtyTabs,
    unsavedTabs,
    placeholder
  } = options;

  const tree = mount(
    <TabLinks
      activeTab={ activeTab || defaultActiveTab }
      tabs={ tabs || defaultTabs }
      onMoveTab={ onMoveTab || noop }
      onSelect={ onSelect || noop }
      dirtyTabs={ dirtyTabs || {} }
      unsavedTabs={ unsavedTabs || {} }
      placeholder={ placeholder } />
  );

  const tabLinks = tree.instance();

  return {
    tree,
    tabLinks
  };
}