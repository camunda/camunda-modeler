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

// eslint-disable-next-line no-undef
const { spy } = sinon;

describe('<PrivacyPreferences>', () => {

  it('should render', async () => {

    await shallow(<PrivacyPreferences />);
  });


  it('should show modal on start if config non existent', async () => {

    const wrapper = await shallow(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve(null);
        });
      }
    } } />);

    expect(wrapper.state('showModal')).to.be.true;
  });


  it('should not show modal on start if config existent', async () => {

    const wrapper = await shallow(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve({});
        });
      }
    } } />);

    expect(wrapper.state('showModal')).to.be.false;
  });


  it('should set isInitialPreferences on start if config non existent', async () => {

    const wrapper = await shallow(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve(null);
        });
      }
    } } />);

    expect(wrapper.state('isInitialPreferences')).to.be.true;
  });


  it('should subscribe to show-privacy-preferences', async () => {

    const subscribeSpy = spy();

    await shallow(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve({});
        });
      }
    } } subscribe={ subscribeSpy } />);

    expect(subscribeSpy).to.have.been.calledWith('show-privacy-preferences');
  });


  it('should save config', async () => {

    const setSpy = spy();
    const wrapper = await mount(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve(null);
        });
      },
      set() {
        setSpy();
      }
    } } subscribe={ () => {} } />);

    await wrapper.update();
    wrapper.find('.btn-primary').first().simulate('click');
    expect(setSpy).to.have.been.called;
  });


  it('should open modal on show-privacy-preferences', async () => {

    let subscribeFunc;
    const setSpy = spy();
    const wrapper = await mount(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve({});
        });
      },
      set() {
        setSpy();
      }
    } } subscribe={ (type, func) => {
      if (type === 'show-privacy-preferences') {
        subscribeFunc = func;
      }
    } } />);

    await subscribeFunc();
    await wrapper.update();
    expect(wrapper.find('.privacyPreferencesField')).to.have.length(1);
  });


  it('should not save config on cancel', async () => {

    let subscribeFunc;
    const setSpy = spy();
    const wrapper = await mount(<PrivacyPreferences config={ {
      get() {
        return new Promise((resolve, reject) => {
          resolve({});
        });
      },
      set() {
        setSpy();
      }
    } } subscribe={ (type, func) => {
      subscribeFunc = func;
    } } />);

    await subscribeFunc();
    await wrapper.update();
    wrapper.find('.btn').at(1).simulate('click');
    expect(setSpy).to.not.have.been.called;
  });
});
