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

import { render, fireEvent, screen, within } from '@testing-library/react';

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

  it('should NOT display on no tabs', function() {

    // given
    const tabs = [];

    // when
    createTabAction({ tabs });

    // then
    expect(screen.queryByRole('button')).to.be.null;
  });


  it('should open', function() {

    // given
    createTabAction();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('button', { name: DEFAULT_TABS[0].name })).to.exist;
    expect(screen.getByRole('button', { name: DEFAULT_TABS[1].name })).to.exist;
    expect(screen.getByRole('button', { name: DEFAULT_TABS[2].name })).to.exist;
  });


  it('should render items', function() {

    // given
    createTabAction();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    const menu = screen.getByRole('dialog');
    const items = within(menu).getAllByRole('menuitem');

    expect(items.map(i => i.textContent)).to.eql([
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

    createTabAction({ subscribe });

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

    fireEvent.click(screen.getByRole('button'));

    const menu = screen.getByRole('dialog');
    const items = within(menu).getAllByRole('button');

    // then
    expect(items.map(i => i.textContent)).to.eql([
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
      createTabAction();

      // when
      fireEvent.click(screen.getByRole('button'));

      // then - first 4 items are actions
      expect(screen.getByRole('menuitem', { name: 'Save all files' })).to.exist;
      expect(screen.getByRole('menuitem', { name: 'Close active tab' })).to.exist;
      expect(screen.getByRole('menuitem', { name: 'Close all tabs' })).to.exist;
      expect(screen.getByRole('menuitem', { name: 'Close other tabs' })).to.exist;
    });


    it('should NOT retrieve all options on one tab only', function() {

      // given
      const tabs = [
        {
          id: 'foo',
          name: 'bar'
        }
      ];

      createTabAction({
        tabs
      });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByRole('menuitem', { name: 'Save all files' })).to.exist;
      expect(screen.getByRole('menuitem', { name: 'Close active tab' })).to.exist;
      expect(screen.queryByRole('menuitem', { name: 'Close all tabs' })).to.be.null;
      expect(screen.queryByRole('menuitem', { name: 'Close other tabs' })).to.be.null;
    });

  });


  describe('trigger actions', function() {

    [
      [ 'save-all', 'Save all files' ],
      [ 'close-active-tab', 'Close active tab' ],
      [ 'close-all-tabs', 'Close all tabs' ],
      [ 'close-other-tabs', 'Close other tabs' ]
    ].forEach(([ action, label ]) => {

      it(`should trigger <${action}>`, function() {

        // given
        const actionSpy = sinon.spy();

        createTabAction({ triggerAction: actionSpy });

        fireEvent.click(screen.getByRole('button'));

        // when
        fireEvent.click(screen.getByRole('button', { name: label }));

        // then
        expect(actionSpy).to.have.been.calledWith(action);
      });
    });


    it('should select tab', function() {

      // given
      const selectSpy = sinon.spy();

      createTabAction({ onSelect: selectSpy });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByRole('button', { name: DEFAULT_TABS[0].name }));

      // then
      expect(selectSpy).to.have.been.calledWith(DEFAULT_TABS[0]);
    });

  });


});


// helpers /////////////////////////////////////

function createTabAction(options = {}) {
  const {
    getTabIcon = () => null,
    onSelect = noop,
    subscribe = () => ({ cancel() {} }),
    tabs = DEFAULT_TABS,
    triggerAction = noop
  } = options;

  // Create a subscribe that immediately emits tabs
  const wrappedSubscribe = (event, callback) => {
    if (event === 'app.tabsChanged') {
      callback({ tabs });
    }
    if (typeof subscribe === 'function' && subscribe.emit) {
      return subscribe(event, callback);
    }
    return { cancel() {} };
  };

  render(
    <TabContextAction
      getTabIcon={ getTabIcon }
      onSelect={ onSelect }
      subscribe={ wrappedSubscribe }
      triggerAction={ triggerAction } />
  );
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
