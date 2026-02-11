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

import { render, fireEvent } from '@testing-library/react';

import PrivacyPreferencesLink from '../PrivacyPreferencesLink';


describe('<PrivacyPreferencesLink>', function() {

  it('should render', function() {
    render(<PrivacyPreferencesLink />);
  });


  it('should display if updates check are disabled', function() {

    // when
    const { container } = createPrivacyPreferencesLink({
      updateChecksEnabled: false
    });

    // then
    expect(container.querySelector('a')).to.exist;
  });


  it('should NOT display if updates check are enabled', function() {

    // when
    const { container } = createPrivacyPreferencesLink({
      updateChecksEnabled: true
    });

    // then
    expect(container.querySelector('a')).to.be.null;
  });


  it('should open privacy preferences', function() {

    // given
    const openSpy = sinon.spy();

    const { container } = createPrivacyPreferencesLink({
      updateChecksEnabled: false,
      onOpenPrivacyPreferences: openSpy
    });

    // when
    fireEvent.click(container.querySelector('a'));

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

  return render(
    <PrivacyPreferencesLink
      updateChecksEnabled={ updateChecksEnabled }
      onOpenPrivacyPreferences={ onOpenPrivacyPreferences || noop }
    />
  );
}

function noop() {}