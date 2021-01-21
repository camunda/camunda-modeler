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

import { shallow } from 'enzyme';

import PrivacyPreferencesLink from '../PrivacyPreferencesLink';


describe('<PrivacyPreferencesLink>', function() {

  it('should render', function() {
    shallow(<PrivacyPreferencesLink />);
  });


  it('should display if updates check are disabled', function() {

    // when
    const wrapper = createPrivacyPreferencesLink({
      updateChecksEnabled: false
    });

    // then
    expect(wrapper.exists('a')).to.be.true;
  });


  it('should NOT display if updates check are enabled', function() {

    // when
    const wrapper = createPrivacyPreferencesLink({
      updateChecksEnabled: true
    });

    // then
    expect(wrapper.exists('a')).to.be.false;
  });


  it('should open privacy preferences', function() {

    // given
    const openSpy = sinon.spy();

    const wrapper = createPrivacyPreferencesLink({
      updateChecksEnabled: false,
      onOpenPrivacyPreferences: openSpy
    });

    // when
    wrapper.find('a').simulate('click');

    // then
    expect(openSpy).to.have.been.calledOnce;
  });

});


// helper

function createPrivacyPreferencesLink(props = {}) {
  const {
    onOpenPrivacyPreferences,
    updateChecksEnabled
  } = props;

  const wrapper = shallow(
    <PrivacyPreferencesLink
      updateChecksEnabled={ updateChecksEnabled }
      onOpenPrivacyPreferences={ onOpenPrivacyPreferences || noop }
    />
  );

  return wrapper;
}

function noop() {}