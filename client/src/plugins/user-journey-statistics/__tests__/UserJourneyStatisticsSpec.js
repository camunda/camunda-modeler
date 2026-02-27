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

import { render } from '@testing-library/react';

import Flags, { MIXPANEL_TOKEN, MIXPANEL_STAGE, DISABLE_REMOTE_INTERACTION } from '../../../util/Flags';

import Metadata from '../../../util/Metadata';
import UserJourneyStatistics from '../UserJourneyStatistics';
import MixpanelHandler from '../MixpanelHandler';

describe('<UserJourneyStatistics>', function() {

  const getGlobal = () => ({
    appPlugins: []
  });

  afterEach(function() {
    Flags.reset();
    Metadata.init({ version:'test-version' });
    MixpanelHandler.getInstance().disable();
  });


  it('should render', function() {

    render(<UserJourneyStatistics subscribe={ () => {} } _getGlobal={ getGlobal } />);
  });


  it('should NOT enable if Mixpanel project token not configured', async function() {

    // given
    const instance = createJourneyStatistics();

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should NOT enable if remote interaction is disabled via flag', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage',
      [ DISABLE_REMOTE_INTERACTION ]: true
    });

    const instance = createJourneyStatistics();

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should NOT enable if usage statistics preference turned off', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const instance = createJourneyStatistics({
      configValues: {
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: false }
      }
    });

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should NOT enable if editor id is missing', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const instance = createJourneyStatistics({
      configValues: {
        'editor.id': null,
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      }
    });

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    try {
      await instance.componentDidMount();
    } catch (error) {
      expect(error.message).to.eql('missing editor id');
    }

    // then
    expect(enableSpy).to.not.have.been.called;
  });


  it('should enable when mounted', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const instance = createJourneyStatistics({
      configValues: {
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      }
    });

    const enableSpy = sinon.spy();

    instance.enable = enableSpy;

    // when
    await instance.componentDidMount();

    // then
    expect(enableSpy).to.have.been.called;
  });


  it('should enable Mixpanel', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const instance = createJourneyStatistics({
      configValues: {
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      }
    });

    const emitSpy = sinon.stub(instance, 'emit');

    const mixpanel = instance.mixpanel;

    expect(mixpanel.isEnabled()).to.be.false;

    // when
    await instance.componentDidMount();

    // then
    expect(mixpanel.isEnabled()).to.be.true;
    expect(emitSpy).to.have.been.calledWith('telemetry.enabled');
  });


  it('should disable mixpanel', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const instance = createJourneyStatistics({
      configValues: {
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      }
    });

    const emitSpy = sinon.stub(instance, 'emit');

    const mixpanel = instance.mixpanel;

    // when
    await instance.componentDidMount();

    instance.disable();

    // then
    expect(mixpanel.isEnabled()).to.eql(false);
    expect(emitSpy).to.have.been.calledWith('telemetry.disabled');
  });


  it('should listen to privacy preference change event', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const subscribeSpy = sinon.spy();

    const instance = createJourneyStatistics({
      configValues: {
        'editor.privacyPreferences': { ENABLE_USAGE_STATISTICS: true }
      },
      subscribeSpy
    });

    // when
    await instance.componentDidMount();

    // then
    expect(subscribeSpy).to.have.been.calledWith('privacy-preferences.changed');
  });


  it('should enable when usage statistics preference switched on', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const subscribeSpy = sinon.spy();

    let usageStatisticsEnabled = false;

    const instance = createJourneyStatistics({
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


  it('should disable when usage statistics preference switched off', async function() {

    // given
    Flags.init({
      [ MIXPANEL_TOKEN ]: 'test',
      [ MIXPANEL_STAGE]: 'stage'
    });

    const subscribeSpy = sinon.spy();

    let usageStatisticsEnabled = true;

    const instance = createJourneyStatistics({
      configGet: () => {
        return { ENABLE_USAGE_STATISTICS: usageStatisticsEnabled };
      },
      subscribeSpy
    });

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


  it('should include event handlers', async function() {

    // given
    const instance = createJourneyStatistics();
    const eventHandlers = instance._eventHandlers;

    // expect
    expect(eventHandlers).to.have.length(9);
    expectHandler(eventHandlers[0], 'ConnectionEventHandler');
    expectHandler(eventHandlers[1], 'DeploymentEventHandler');
    expectHandler(eventHandlers[2], 'FormEditorEventHandler');
    expectHandler(eventHandlers[3], 'LinkEventHandler');
    expectHandler(eventHandlers[4], 'OverlayEventHandler');
    expectHandler(eventHandlers[5], 'PingEventHandler');
    expectHandler(eventHandlers[6], 'TabEventHandler');
    expectHandler(eventHandlers[7], 'ModelingEventHandler');
    expectHandler(eventHandlers[8], 'TaskTestingEventHandler');
  });

});


// helpers //////////////////

function createJourneyStatistics(props = {}) {

  const configValues = {
    'editor.id': 'test-editor-id',
    ...props.configValues
  };

  const subscribe = (key, callback) => {
    if (props.subscribeSpy) {
      props.subscribeSpy(key, callback);
    }
  };

  //   This component does not render anything.
  //   We don't need to mount it / or shallow.
  return new UserJourneyStatistics({
    subscribe,
    config: {
      get: (key) => {

        if (props.configGet) {
          return props.configGet(key);
        }

        return new Promise((resolve) => {
          resolve(configValues[key] || null);
        });
      }
    },
    _getGlobal: () => ({}),
    triggerAction: () => {}
  });
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

function expectHandler(handler, expectedHandlerName) {
  expect(handler instanceof require(`../event-handlers/${expectedHandlerName}`).default).to.be.true;
}
