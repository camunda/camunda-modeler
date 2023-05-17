/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import TabLinks from '../TabLinks';

import { SlotFillRoot } from '../../slot-fill';

import {
  defaultActiveTab,
  defaultTabs
} from './mocks';

const [
  tab1
] = defaultTabs;

const { spy } = sinon;


describe('<TabLinks>', function() {

  describe('render', function() {

    it('should display tab type', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const type = tree.find('.tab[data-tab-id="tab1"] .tab__type');

      // then
      expect(type.exists()).to.be.true;
    });


    it('should render type component', function() {

      // given
      const getTabIcon = () => NoopComponent;

      const {
        tree
      } = renderTabLinks({
        getTabIcon
      });

      // when
      const type = tree.find('.tab[data-tab-id="tab1"] .tab__type');

      // then
      expect(type.find('.empty')).to.exist;
    });


    it('should display tab name', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const name = tree.find('.tab[data-tab-id="tab1"] .tab__name');

      // then
      expect(name.text()).to.eql(tab1.name);
    });


    it('should display tab title', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const node = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      // then
      expect(node.title).to.eql(tab1.title);
    });


    it('should display close on active', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const close = tree.find('.tab[data-tab-id="tab1"] .tab__close');

      // then
      expect(close.exists()).to.be.true;
    });


    it('should display close on non active', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const close = tree.find('.tab[data-tab-id="tab2"] .tab__close');

      // then
      expect(close.exists()).to.be.true;
    });


    it('should display dirty', function() {

      // given
      const {
        tree
      } = renderTabLinks({
        isDirty: (tab) => tab.id === 'tab1'
      });

      // when
      const close = tree.find('.tab[data-tab-id="tab1"] .tab__dirty-marker');

      // then
      expect(close.exists()).to.be.true;
    });


    it('should NOT display dirty', function() {

      // given
      const {
        tree
      } = renderTabLinks({
        isDirty: (tab) => tab.id !== 'tab1'
      });

      // when
      const close = tree.find('.tab[data-tab-id="tab1"] .tab__dirty-marker');

      // then
      expect(close.exists()).to.be.false;
    });

  });


  describe('actions', function() {

    it('should call <onSelect> handler', function() {

      // given
      const clickSpy = sinon.spy();

      const {
        tree
      } = renderTabLinks({
        onSelect: clickSpy
      });

      const close = tree.find('.tab[data-tab-id="tab1"]');

      // when
      close.simulate('click');

      // then
      expect(clickSpy).to.have.been.calledWith(tab1);
    });


    it('should call <onContextMenu> handler', function() {

      // given
      const contextMenuSpy = sinon.spy();

      const {
        tree
      } = renderTabLinks({
        onContextMenu: contextMenuSpy
      });

      const tab = tree.find('.tab[data-tab-id="tab1"]');

      // when
      tab.simulate('contextmenu');

      // then
      expect(contextMenuSpy).to.have.been.called;
    });


    it('should call <onClose> handler', function() {

      // given
      const closeSpy = sinon.spy();

      const {
        tree
      } = renderTabLinks({
        onClose: closeSpy
      });

      const close = tree.find('.tab[data-tab-id="tab1"] .tab__close');

      // when
      close.simulate('click');

      // then
      expect(closeSpy).to.have.been.calledWith(tab1);
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
      const tab = tree.find('.tab--placeholder');

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


  describe('small state', function() {

    it('should NOT set <small> selector initially', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const tabNode = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      // then
      expect(tabNode.classList.contains('tab--small')).to.be.false;
    });


    // TODO(pinussilvestrus): the resize observer is hard to test
    // in the current test environment
    it.skip('should set <small> selector on resize', function() {

      // given
      const tabs = Array(10).fill().map((_, i) => {
        return {
          id: `tab${i}`,
          name: `tab${i}.tab`
        };
      });

      const {
        tree
      } = renderTabLinks({
        tabs
      });

      // when
      const tabNode = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      tabNode.dispatchEvent(new Event('resize'));

      // then
      expect(tabNode.classList.contains('tab--small')).to.be.true;
    });

  });


  describe('smaller state', function() {

    it('should NOT set <smaller> selector initially', function() {

      // given
      const {
        tree
      } = renderTabLinks();

      // when
      const tabNode = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      // then
      expect(tabNode.classList.contains('tab--smaller')).to.be.false;
    });


    // TODO(pinussilvestrus): the resize observer is hard to test
    // in the current test environment
    it.skip('should set <smaller> selector on resize', function() {

      // given
      const tabs = Array(20).fill().map((_, i) => {
        return {
          id: `tab${i}`,
          name: `tab${i}.tab`
        };
      });

      const {
        tree
      } = renderTabLinks({
        tabs
      });

      // when
      const tabNode = tree.find('.tab[data-tab-id="tab1"]').getDOMNode();

      tabNode.dispatchEvent(new Event('resize'));

      // then
      expect(tabNode.classList.contains('tab--small')).to.be.true;
    });

  });

});

function noop() {}

function NoopComponent() {
  return <span className="empty"></span>;
}

function renderTabLinks(options = {}) {
  const {
    activeTab,
    tabs,
    getTabIcon,
    onClose,
    onContextMenu,
    onMoveTab,
    onSelect,
    isDirty = () => false,
    placeholder
  } = options;

  const tree = mount(
    <SlotFillRoot>
      <TabLinks
        activeTab={ activeTab || defaultActiveTab }
        tabs={ tabs || defaultTabs }
        getTabIcon={ getTabIcon || noop }
        onContextMenu={ onContextMenu || noop }
        onClose={ onClose || noop }
        onMoveTab={ onMoveTab || noop }
        onSelect={ onSelect || noop }
        isDirty={ isDirty }
        placeholder={ placeholder } />
    </SlotFillRoot>
  );

  const tabLinks = tree.find('TabLinks').first().instance();

  return {
    tree,
    tabLinks
  };
}
