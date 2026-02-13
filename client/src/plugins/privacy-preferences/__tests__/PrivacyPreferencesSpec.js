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

import { render, waitFor } from '@testing-library/react';

import PrivacyPreferences from '../PrivacyPreferences';

import { OK_BUTTON_TEXT, CANCEL_BUTTON_TEXT } from '../constants';

import { Config } from '../../../app/__tests__/mocks';

const { spy } = sinon;

describe('<PrivacyPreferences>', function() {

  it('should render', async function() {
    await createPrivacyPreferences();
  });


  it('should show modal on start if config non existent', async function() {

    // when
    const { getByRole } = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        }
      }
    });

    // then
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
  });


  it('should default to opt-out on start if config non existent', async function() {

    // when
    const { getByRole } = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        }
      }
    });

    // then
    await waitFor(() => {
      const modal = getByRole('dialog');
      expect(modal.querySelector('#ENABLE_CRASH_REPORTS').checked).to.be.true;
      expect(modal.querySelector('#ENABLE_USAGE_STATISTICS').checked).to.be.true;
      expect(modal.querySelector('#ENABLE_UPDATE_CHECKS').checked).to.be.true;
    });
  });


  it('should not show modal on start if config existent', async function() {

    // when
    const { queryByRole } = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve({});
          });
        }
      }
    });

    // then
    expect(queryByRole('dialog')).to.be.null;
  });


  it('should set isInitialPreferences on start if config non existent', async function() {

    // when
    const { queryByRole } = await createPrivacyPreferences({
      config: {
        get() {
          return new Promise((resolve, reject) => {
            resolve(null);
          });
        }
      }
    });

    // then
    expect(queryByRole('button', { name: CANCEL_BUTTON_TEXT })).to.not.exist;
  });


  it('should subscribe to show-privacy-preferences', async function() {

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
      },
      subscribe: subscribeSpy
    });

    // then
    expect(subscribeSpy).to.have.been.calledWith('show-privacy-preferences');
  });


  it('should save config', async function() {

    // given
    const setSpy = spy();

    const { getByRole } = await createPrivacyPreferences({
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
    });

    // when
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
    getByRole('button', { name: OK_BUTTON_TEXT }).click();

    // then
    await waitFor(() => {
      expect(setSpy).to.have.been.called;
    });
  });


  it('should open modal on show-privacy-preferences', async function() {

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

    const { queryByRole, getByRole } = await createPrivacyPreferences({
      config, subscribe
    });

    // expected
    expect(queryByRole('dialog')).to.not.exist;

    // when
    await subscribeFunc({});

    // then
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
  });


  it('should not save config on cancel', async function() {

    // given
    let subscribeFunc;

    const setSpy = spy();

    const { getByRole } = await createPrivacyPreferences({
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
    });

    // when
    await subscribeFunc({});
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
    getByRole('button', { name: CANCEL_BUTTON_TEXT }).click();

    // then
    expect(setSpy).to.not.have.been.called;
  });

});


// helper ///////////////////

async function createPrivacyPreferences(props = {}) {
  const {
    autoFocusKey,
    config = new Config(),
    triggerAction,
    subscribe
  } = props;

  return render(
    <PrivacyPreferences
      autoFocusKey={ autoFocusKey }
      config={ config }
      triggerAction={ triggerAction || noop }
      subscribe={ subscribe || noop }
    />
  );
}

function noop() {}
