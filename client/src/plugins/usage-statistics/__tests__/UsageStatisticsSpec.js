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

import UsageStatistics from '../UsageStatistics';
import BaseEventHandler from '../event-handlers/BaseEventHandler';

import Flags, { ET_ENDPOINT, DISABLE_REMOTE_INTERACTION } from '../../../util/Flags';

import Metadata from '../../../util/Metadata';

const FETCH_METHOD = 'POST';
const FETCH_HEADERS = { 'Accept': 'application/json', 'Content-Type': 'application/json' };

describe('<UsageStatistics>', () => {

  afterEach(() => {
    Flags.reset();
    Metadata.init({});
  });


  it('should render', () => {

    createUsageStatistics();
  });


  it('should not enable if ET endpoint not configured', async () => {

    // given
    const { instance } = createUsageStatistics();

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should not enable if remote interaction is disabled via flag', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint',
      [ DISABLE_REMOTE_INTERACTION ]: true
    });

    const { instance } = createUsageStatistics();

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should not enable if usage statistics preference turned off', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: { 'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: false } }
    });

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should enable when mounted', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: { 'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true } }
    });

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.have.been.called;
  });


  it('should enable registered event handlers', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: { 'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true } }
    });

    const eventHandler = new BaseEventHandler('test-event', () => {});

    instance._eventHandlers = [ eventHandler ];

    // when
    await instance.componentDidMount();

    // then
    expect(eventHandler.isEnabled()).to.eql(true);
  });


  it('should disable registered event handlers', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: { 'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true } }
    });

    const eventHandler = new BaseEventHandler('test-event', () => {});

    instance._eventHandlers = [ eventHandler ];

    // when
    await instance.componentDidMount();

    instance.disable();

    // then
    expect(eventHandler.isEnabled()).to.eql(false);
  });


  it('should listen to privacy preference change event', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const subscribeSpy = sinon.spy();

    const { instance } = createUsageStatistics({
      configValues: { 'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true } },
      subscribeSpy
    });

    instance.fetch = () => {};

    // when
    await instance.componentDidMount();

    // then
    expect(subscribeSpy).to.have.been.calledWith('privacy-preferences.changed');
  });


  it('should enable when usage statistics preference switched on', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const subscribeSpy = sinon.spy();

    let usageStatisticsEnabled = false;

    const { instance } = createUsageStatistics({
      configGet: () => {
        return { ENABLE_USAGE_STATISTICS: usageStatisticsEnabled };
      },
      subscribeSpy
    });

    const enableSpy = sinon.spy();
    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;

    // when
    const fn = getSubscriptionCallbackFromSpy(subscribeSpy, 'privacy-preferences.changed');

    usageStatisticsEnabled = true;
    await fn();

    // then
    expect(enableSpy).to.have.been.called;
  });


  it('should disable when usage statistics preference switched off', async () => {

    // given
    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const subscribeSpy = sinon.spy();

    let usageStatisticsEnabled = true;

    const { instance } = createUsageStatistics({
      configGet: () => {
        return { ENABLE_USAGE_STATISTICS: usageStatisticsEnabled };
      },
      subscribeSpy
    });

    instance.fetch = () => {};

    const disableSpy = sinon.spy();
    instance.disable = disableSpy;

    // when
    await instance.componentDidMount();

    const fn = getSubscriptionCallbackFromSpy(subscribeSpy, 'privacy-preferences.changed');

    usageStatisticsEnabled = false;
    await fn();

    // then
    expect(disableSpy).to.have.been.called;
  });


  it('should send request to ET', async () => {

    // given
    Metadata.init({ version: '3.5.0' });

    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: {
        'editor.id': 'test-editor-id',
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      }
    });

    instance._eventHandlers = [];

    const fetchSpy = sinon.spy();
    instance.fetch = fetchSpy;

    // when
    await instance.componentDidMount();

    instance.enable();

    await instance.sendRequest({ event: 'test-event' });

    const args = fetchSpy.getCall(0).args;

    // then
    expect(args[0]).to.eql('test-et-endpoint');
    expect(args[1]).to.eql({
      method: FETCH_METHOD,
      headers: FETCH_HEADERS,
      body: JSON.stringify({
        installation: 'test-editor-id',
        product: {
          name: 'Modeler',
          version: '3.5.0',
          edition: 'Community',
          internals: { event: 'test-event' }
        }
      })
    });
  });


  it('should not send request to ET if not enabled', async () => {

    // given
    Metadata.init({ version: '3.5.0' });

    Flags.init({
      [ ET_ENDPOINT ]: 'test-et-endpoint'
    });

    const { instance } = createUsageStatistics({
      configValues: {
        'editor.id': 'test-editor-id',
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: false }
      }
    });

    // when
    await instance.componentDidMount();

    const fetchSpy = sinon.spy();
    instance.fetch = fetchSpy;

    await instance.sendRequest({ event: 'test-event' });

    // then
    expect(fetchSpy).to.not.have.been.called;
  });
});

function createUsageStatistics(props={}) {

  const configValues = props.configValues || {};

  const subscribe = (key, callback) => {
    if (props.subscribeSpy) {
      props.subscribeSpy(key, callback);
    }
  };

  const component = shallow(
    <UsageStatistics
      subscribe={ subscribe }
      config={ {
        get: (key) => {

          if (props.configGet) {
            return props.configGet(key);
          }

          return new Promise((resolve) => {
            resolve(configValues[key] || null);
          });
        }
      } }
    />
  );

  const instance = component.instance();

  return { component, instance };
}

function getSubscriptionCallbackFromSpy(spy, key) {

  const calls = spy.getCalls();

  for (let i = 0; i < calls.length; i ++) {

    const call = calls[i];
    const args = call.args;

    if (args[0] === key) {
      return args[1];
    }
  }

  return null;
}
