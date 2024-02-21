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

import { act } from 'react-dom/test-utils';

import {
  mount
} from 'enzyme';

import { TabContextAction } from '../TabContextAction';

const DEFAULT_TABS = [
  {
    id: 'tab1',
    name: 'tab1.name'
  },
  {
    id: 'tab2',
    name: 'tab2.name'
  },
  {
    id: 'tab3',
    name: 'tab3.name'
  }
];


describe('<TabContextAction>', function() {

  it('should render', function() {
    expect(createTabAction).not.to.throw();
  });


  it('should display', async function() {

    // when
    const {
      tree
    } = createTabAction();

    // then
    expect(tree.isEmptyRender()).to.be.false;
  });


  it('should NOT display on no tabs', function() {

    // given
    const tabs = [];

    // when
    const {
      tree
    } = createTabAction({ tabs });

    // then
    expect(tree.isEmptyRender()).to.be.true;
  });


  it('should open', function() {

    // given
    const {
      tree
    } = createTabAction();

    // assume
    expect(tree.exists('Overlay')).to.be.false;

    // when
    tree.find('button').simulate('click');

    // then
    expect(tree.exists('Overlay')).to.be.true;
  });


  it('should render items', function() {

    // given
    const {
      tree
    } = createTabAction();

    tree.find('button').simulate('click');

    // when
    const items = tree.find('Overlay li');

    // then
    expect(nodesAsTextList(items)).to.eql([
      'Save all files',
      'Close active tab',
      'Close all tabs',
      'Close other tabs',
      'tab1.name',
      'tab2.name',
      'tab3.name'
    ]);
  });


  it('should set items via event', function() {

    // given
    const subscribe = createSubscribe();

    const {
      tree
    } = createTabAction({ subscribe });

    // when
    subscribe.emit({
      tabs: [
        ...DEFAULT_TABS,
        {
          id: 'foo',
          name: 'bar'
        }
      ]
    });
    tree.find('button').simulate('click');

    const items = tree.find('Overlay li');

    // then
    expect(nodesAsTextList(items)).to.eql([
      'Save all files',
      'Close active tab',
      'Close all tabs',
      'Close other tabs',
      'tab1.name',
      'tab2.name',
      'tab3.name',
      'bar'
    ]);
  });


  describe('#getActionOptions', function() {

    it('should retrieve all actions', function() {

      // given
      const {
        instance
      } = createTabAction();

      // when
      const options = instance.getActionOptions();

      // then
      expect(asTextList(options.items)).to.eql([
        'Save all files',
        'Close active tab',
        'Close all tabs',
        'Close other tabs'
      ]);
    });


    it('should NOT retrieve all options on one tab only', function() {

      // given
      const tabs = [
        {
          id: 'foo',
          name: 'bar'
        }
      ];

      const {
        instance
      } = createTabAction({
        tabs
      });

      // when
      const options = instance.getActionOptions();

      // then
      expect(asTextList(options.items)).to.eql([
        'Save all files',
        'Close active tab'
      ]);
    });

  });


  describe('trigger actions', function() {

    [
      'save-all',
      'close-active-tab',
      'close-all-tabs',
      'close-other-tabs'
    ].forEach((action, index) => {

      it(`should trigger <${action}>`, function() {

        // given
        const actionSpy = sinon.spy();

        const {
          tree
        } = createTabAction({ triggerAction: actionSpy });

        tree.find('button').simulate('click');

        // when
        const item = tree.find('Overlay li button').at(index);
        item.simulate('click');

        // then
        expect(actionSpy).to.have.been.calledWith(action);
      });
    });


    it('should select tab', function() {

      // given
      const selectSpy = sinon.spy();

      const {
        tree
      } = createTabAction({ onSelect: selectSpy });

      tree.find('button').simulate('click');

      // when
      const item = tree.find('Overlay li button').at(4);
      item.simulate('click');

      // then
      expect(selectSpy).to.have.been.calledWith(DEFAULT_TABS[0]);
    });

  });


});


// helpers /////////////////////////////////////

function createTabAction(options = {}) {
  const {
    getTabIcon = noop,
    onSelect = noop,
    subscribe = createSubscribe,
    tabs = DEFAULT_TABS,
    triggerAction = noop
  } = options;

  const tree = mount(
    <TabContextAction
      getTabIcon={ getTabIcon }
      onSelect={ onSelect }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  );

  const instance = tree.instance();

  setTabs(tabs, tree, instance);

  return {
    tree,
    instance
  };
}

function setTabs(tabs, wrapper, instance) {
  act(() => instance.setState({
    tabs
  }));

  return wrapper.update();
}

function noop() {}

function createSubscribe() {

  /**
   * @type { (...args) => void }
   */
  let cb = noop;

  function subscribe(_, callback) {
    cb = callback;

    return {
      cancel() {
        cb = noop;
      }
    };
  }

  subscribe.emit = (payload) => cb(payload);

  return subscribe;
}

function nodesAsTextList(items) {
  return items.map(i => i.text());
}

function asTextList(items) {
  return items.map(i => i.text);
}
