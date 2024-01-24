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

import { RecentTabs } from '../RecentTabs';

const { spy } = sinon;
const NOOP = () => {};


describe('RecentTabs', function() {

  it('should set elements', function() {

    // given
    const setStateSpy = spy();

    const tab = createTab('foo');
    const recentTabs = new RecentTabs({
      config: {
        set: NOOP,
        get: NOOP
      },
      setState: setStateSpy
    });

    // when
    recentTabs.push(tab);

    // then
    expect(setStateSpy).to.have.been.calledOnce;
  });


  it('should persist state', function() {

    // given
    const setConfigSpy = spy();

    const tab = createTab('foo');
    const recentTabs = new RecentTabs({
      config: {
        set: setConfigSpy,
        get: NOOP
      },
      setState: NOOP
    });

    // when
    recentTabs.push(tab);

    // then
    expect(setConfigSpy).to.have.been.calledWith('recentTabs', [
      tab
    ]);
  });


  it('should load state', async function() {

    // given
    const setStateSpy = spy();

    const tab = createTab('foo');

    // when
    new RecentTabs({
      config: {
        set: NOOP,
        get: () => [ tab ]
      },
      setState: setStateSpy
    });

    await nextTick();

    // then
    expect(setStateSpy).to.have.been.calledWith([
      tab
    ]);
  });


  it('should limit to 10 entries', function() {

    // given
    const setStateSpy = spy();

    // Create 11 tabs
    const tabs = Array(20).fill().map((_, i) => createTab(`foo_${i}`));

    const recentTabs = new RecentTabs({
      config: {
        set: NOOP,
        get: NOOP
      },
      setState: setStateSpy
    });

    // when

    tabs.forEach(tab => recentTabs.push(tab));

    // then
    expect(setStateSpy.lastCall.args[0]).to.have.length(10);
  });


  it('should not add the same tab twice', function() {

    // given
    const setStateSpy = spy();
    const tab1 = createTab('foo');
    const tab2 = createTab('bar');
    const tab3 = createTab('baz');

    const recentTabs = new RecentTabs({
      config: {
        set: NOOP,
        get: NOOP
      },
      setState: setStateSpy
    });

    recentTabs.push(tab1);
    recentTabs.push(tab2);
    recentTabs.push(tab3);

    // assume
    expect(setStateSpy.lastCall).to.have.been.calledWith([
      tab1,
      tab2,
      tab3
    ]);

    // when
    recentTabs.push(tab2);

    // then
    expect(setStateSpy.lastCall).to.have.been.calledWith([
      tab1,
      tab3,
      tab2
    ]);

  });

});


function createTab(path) {
  return {
    file: {
      path
    }
  };
}

async function nextTick() {
  return new Promise(resolve => resolve());
}