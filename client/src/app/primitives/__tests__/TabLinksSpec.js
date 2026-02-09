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

import React, { createRef } from 'react';

import { render, fireEvent } from '@testing-library/react';

import TabLinks from '../TabLinks';

import { SlotFillRoot } from '../../slot-fill';

import {
  defaultActiveTab,
  defaultTabs,
  defaultTabGroups
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
        container
      } = renderTabLinks();

      // when
      const type = container.querySelector('.tab[data-tab-id="tab1"] .tab__type');

      // then
      expect(type).to.exist;
    });


    it('should render type component', function() {

      // given
      const getTabIcon = () => NoopComponent;

      const {
        container
      } = renderTabLinks({
        getTabIcon
      });

      // when
      const type = container.querySelector('.tab[data-tab-id="tab1"] .tab__type');

      // then
      expect(type.querySelector('.empty')).to.exist;
    });


    it('should display tab name', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const name = container.querySelector('.tab[data-tab-id="tab1"] .tab__name');

      // then
      expect(name.textContent).to.eql(tab1.name);
    });


    it('should display tab title', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const node = container.querySelector('.tab[data-tab-id="tab1"]');

      // then
      expect(node.title).to.eql(tab1.title);
    });


    it('should display close on active', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const close = container.querySelector('.tab[data-tab-id="tab1"] .tab__close');

      // then
      expect(close).to.exist;
    });


    it('should display close on non active', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const close = container.querySelector('.tab[data-tab-id="tab2"] .tab__close');

      // then
      expect(close).to.exist;
    });


    it('should display dirty', function() {

      // given
      const {
        container
      } = renderTabLinks({
        isDirty: (tab) => tab.id === 'tab1'
      });

      // when
      const dirtyMarker = container.querySelector('.tab[data-tab-id="tab1"] .tab__dirty-marker');

      // then
      expect(dirtyMarker).to.exist;
    });


    it('should NOT display dirty', function() {

      // given
      const {
        container
      } = renderTabLinks({
        isDirty: (tab) => tab.id !== 'tab1'
      });

      // when
      const dirtyMarker = container.querySelector('.tab[data-tab-id="tab1"] .tab__dirty-marker');

      // then
      expect(dirtyMarker).to.be.null;
    });

  });


  describe('grouping', function() {

    it('should group tabs', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const tab1 = container.querySelector('.tab[data-tab-id="tab1"]'),
            tab2 = container.querySelector('.tab[data-tab-id="tab2"]'),
            tab3 = container.querySelector('.tab[data-tab-id="tab3"]'),
            tab4 = container.querySelector('.tab[data-tab-id="tab4"]');

      // then
      expect(tab1).to.exist;
      expect(tab1.classList.contains('tab--group')).to.be.true;
      expect(tab1.style.getPropertyValue('--tab-line-group-background-color')).to.exist;

      expect(tab2).to.exist;
      expect(tab2.classList.contains('tab--group')).to.be.true;
      expect(tab2.style.getPropertyValue('--tab-line-group-background-color')).to.exist;
      expect(tab2.style.getPropertyValue('--tab-line-group-background-color')).to.equal(tab1.style.getPropertyValue('--tab-line-group-background-color'));

      expect(tab3).to.exist;
      expect(tab3.classList.contains('tab--group')).to.be.true;
      expect(tab3.style.getPropertyValue('--tab-line-group-background-color')).to.exist;
      expect(tab3.style.getPropertyValue('--tab-line-group-background-color')).not.to.equal(tab1.style.getPropertyValue('--tab-line-group-background-color'));

      expect(tab4).to.exist;
      expect(tab4.classList.contains('tab--group')).to.be.false;
      expect(tab4.style.getPropertyValue('--tab-line-group-background-color')).to.equal('');
    });

  });


  describe('actions', function() {

    it('should call <onSelect> handler', function() {

      // given
      const clickSpy = sinon.spy();

      const {
        container
      } = renderTabLinks({
        onSelect: clickSpy
      });

      const tab = container.querySelector('.tab[data-tab-id="tab1"]');

      // when
      fireEvent.click(tab);

      // then
      expect(clickSpy).to.have.been.calledWith(tab1);
    });


    it('should call <onContextMenu> handler', function() {

      // given
      const contextMenuSpy = sinon.spy();

      const {
        container
      } = renderTabLinks({
        onContextMenu: contextMenuSpy
      });

      const tab = container.querySelector('.tab[data-tab-id="tab1"]');

      // when
      fireEvent.contextMenu(tab);

      // then
      expect(contextMenuSpy).to.have.been.called;
    });


    it('should call <onClose> handler', function() {

      // given
      const closeSpy = sinon.spy();

      const {
        container
      } = renderTabLinks({
        onClose: closeSpy
      });

      const close = container.querySelector('.tab[data-tab-id="tab1"] .tab__close');

      // when
      fireEvent.click(close);

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
        container
      } = renderTabLinks({ placeholder });

      // when
      const tab = container.querySelector('.tab--placeholder');

      // then
      expect(tab).to.exist;

      // and when
      fireEvent.click(tab);

      // then
      expect(clickSpy).to.have.been.calledOnce;
    });


    it('should hide empty tab handle', function() {

      const {
        container
      } = renderTabLinks();

      // when
      const tab = container.querySelector('.tab.placeholder');

      // then
      expect(tab).to.be.null;
    });

  });


  describe('dragging', function() {

    it('should handle dragstart', function() {

      // given
      const onSelectSpy = spy();

      const {
        container,
        tabLinks
      } = renderTabLinks({
        onSelect: onSelectSpy
      });

      const node = container.querySelector('.tab[data-tab-id="tab2"]');

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
        container,
        tabLinks
      } = renderTabLinks({
        onMoveTab: moveTabSpy
      });

      const node = container.querySelector('.tab[data-tab-id="tab2"]');

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
        container
      } = renderTabLinks();

      // when
      const tabNode = container.querySelector('.tab[data-tab-id="tab1"]');

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
        container
      } = renderTabLinks({
        tabs
      });

      // when
      const tabNode = container.querySelector('.tab[data-tab-id="tab1"]');

      tabNode.dispatchEvent(new Event('resize'));

      // then
      expect(tabNode.classList.contains('tab--small')).to.be.true;
    });

  });


  describe('smaller state', function() {

    it('should NOT set <smaller> selector initially', function() {

      // given
      const {
        container
      } = renderTabLinks();

      // when
      const tabNode = container.querySelector('.tab[data-tab-id="tab1"]');

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
        container
      } = renderTabLinks({
        tabs
      });

      // when
      const tabNode = container.querySelector('.tab[data-tab-id="tab1"]');

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
    tabGroups,
    getTabIcon,
    onClose,
    onContextMenu,
    onMoveTab,
    onSelect,
    isDirty = () => false,
    placeholder
  } = options;

  const tabLinksRef = createRef();

  const { container } = render(
    <SlotFillRoot>
      <TabLinks
        ref={ tabLinksRef }
        activeTab={ activeTab || defaultActiveTab }
        tabs={ tabs || defaultTabs }
        tabGroups={ tabGroups || defaultTabGroups }
        getTabIcon={ getTabIcon || noop }
        onContextMenu={ onContextMenu || noop }
        onClose={ onClose || noop }
        onMoveTab={ onMoveTab || noop }
        onSelect={ onSelect || noop }
        isDirty={ isDirty }
        placeholder={ placeholder } />
    </SlotFillRoot>
  );

  const tabLinks = tabLinksRef.current;

  return {
    container,
    tabLinks
  };
}
