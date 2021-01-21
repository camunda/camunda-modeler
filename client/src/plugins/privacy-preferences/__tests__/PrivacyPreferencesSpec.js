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

import {
  mount,
  shallow
} from 'enzyme';

import PrivacyPreferences from '../PrivacyPreferences';

const { spy } = sinon;

describe('<PrivacyPreferences>', () => {

  it('should render', async () => {

    // given
    await createPrivacyPreferences();
  });


  it('should show modal on start if config non existent', async () => {

    // when
    const wrapper = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        }
      }
    });

    // then
    expect(wrapper.state('showModal')).to.be.true;
  });


  it('should not show modal on start if config existent', async () => {

    // when
    const wrapper = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve({});
          });
        }
      }
    });

    // then
    expect(wrapper.state('showModal')).to.be.false;
  });


  it('should set isInitialPreferences on start if config non existent', async () => {

    // when
    const wrapper = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        }
      }
    });

    // then
    expect(wrapper.state('isInitialPreferences')).to.be.true;
  });


  it('should subscribe to show-privacy-preferences', async () => {

    // given
    const subscribeSpy = spy();

    // when
    await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve({});
          });
        }
      }, subscribe: subscribeSpy
    });

    // then
    expect(subscribeSpy).to.have.been.calledWith('show-privacy-preferences');
  });


  it('should save config', async () => {

    // given
    const setSpy = spy();

    const wrapper = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        },
        set() {
          return new Promise((resolve, reject) => {
            setSpy();
            resolve(null);
          });
        }
      }
    }, mount);

    // when
    await wrapper.update();

    wrapper.find('.btn-primary').first().simulate('click');

    // then
    expect(setSpy).to.have.been.called;
  });


  it('should open modal on show-privacy-preferences', async () => {

    // given
    let subscribeFunc;

    const setSpy = spy();

    const config = {
      get() {
        return new Promise((resolve, reject) => {
          resolve({});
        });
      },
      set() {
        setSpy();
      }
    };

    const subscribe = (type, func) => {
      if (type === 'show-privacy-preferences') {
        subscribeFunc = func;
      }
    };

    const wrapper = await createPrivacyPreferences({
      config, subscribe
    }, mount);

    // when
    await subscribeFunc({});

    await wrapper.update();

    // then
    expect(wrapper.find('.privacyPreferencesField')).to.have.length(1);
  });


  it('should not save config on cancel', async () => {

    // given
    let subscribeFunc;

    const setSpy = spy();

    const wrapper = await createPrivacyPreferences({
      config: {
        get() {
          return Promise.resolve({});
        },
        set() {
          setSpy();
        }
      },
      subscribe: (type, func) => {
        subscribeFunc = func;
      }
    }, mount);

    // when
    await subscribeFunc({});
    await wrapper.update();
    wrapper.find('.btn-secondary').simulate('click');

    // then
    expect(setSpy).to.not.have.been.called;
  });

});


// helper ///////////////////

function createPrivacyPreferences(props = {}, mount = shallow) {
  const {
    autoFocusKey,
    config,
    triggerAction,
    subscribe
  } = props;

  return mount(
    <PrivacyPreferences
      autoFocusKey={ autoFocusKey }
      config={ config }
      triggerAction={ triggerAction || noop }
      subscribe={ subscribe || noop }
    />
  );
}

function noop() {}
