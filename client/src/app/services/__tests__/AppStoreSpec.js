/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import AppStore from '../AppStore';


describe('AppStore', function() {

  it('should expose setState and getState', function() {

    // given
    const state = { count: 0 };
    const store = new AppStore({
      setState: (patch) => Object.assign(state, typeof patch === 'function' ? patch(state) : patch),
      getState: () => state
    });

    // when
    store.setState({ count: 1 });

    // then
    expect(store.getState().count).to.equal(1);
  });


  it('should accept updater function', function() {

    // given
    const state = { count: 5 };
    const store = new AppStore({
      setState: (updater) => {
        const patch = typeof updater === 'function' ? updater(state) : updater;
        Object.assign(state, patch);
      },
      getState: () => state
    });

    // when
    store.setState((s) => ({ count: s.count + 1 }));

    // then
    expect(store.getState().count).to.equal(6);
  });


  it('should pass callback to underlying setState', function() {

    // given
    let callbackCalled = false;
    const state = {};
    const store = new AppStore({
      setState: (_patch, callback) => {
        if (callback) callback();
      },
      getState: () => state
    });

    // when
    store.setState({}, () => {
      callbackCalled = true;
    });

    // then
    expect(callbackCalled).to.be.true;
  });


  it('should throw if setState is not a function', function() {

    expect(() => new AppStore({ setState: null, getState: () => ({}) }))
      .to.throw('AppStore requires a setState function');
  });


  it('should throw if getState is not a function', function() {

    expect(() => new AppStore({ setState: () => {}, getState: null }))
      .to.throw('AppStore requires a getState function');
  });

});
