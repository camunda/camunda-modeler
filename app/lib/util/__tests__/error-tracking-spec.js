/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const sinon = require('sinon');

const os = require('os');

const errorTracking = require('../error-tracking');


describe('error-tracking', function() {

  beforeEach(function() {
    process.env.SENTRY_DSN = 'SOME_SENTRY_DSN';
  });


  afterEach(function() {
    process.env.SENTRY_DSN = null;
  });


  it('should not initialize Sentry if Privacy Preferences non existent', function() {

    // given
    const sentryInitSpy = sinon.spy();

    const config = mockConfig();
    const flags = mockFlags();
    const renderer = mockRenderer();
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    // then
    expect(sentryInitSpy).to.not.have.been.called;
  });


  it('should not initialize Sentry if error tracking not enabled', function() {

    // given
    const sentryInitSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': false } });
    const flags = mockFlags();
    const renderer = mockRenderer();
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    // then
    expect(sentryInitSpy).to.not.have.been.called;
  });


  it('should not initialize Sentry if remote interaction disabled', function() {

    // given
    const sentryInitSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags({ 'disable-remote-interaction': true });
    const renderer = mockRenderer();
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    // then
    expect(sentryInitSpy).to.not.have.been.called;
  });


  it('should initialize', function() {

    // given
    const sentryInitSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags();
    const renderer = mockRenderer();
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const params = sentryInitSpy.getCall(0).args[0];

    // then
    expect(params.dsn).to.eql('SOME_SENTRY_DSN');
    expect(params.release).to.eql('v2');
    expect(params.integrations).to.have.length(1);
  });


  it('should use sentry-dsn flag', function() {

    // given
    const sentryInitSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags({ 'sentry-dsn': 'FLAG_SENTRY_DSN' });
    const renderer = mockRenderer();
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const params = sentryInitSpy.getCall(0).args[0];

    // then
    expect(params.dsn).to.eql('FLAG_SENTRY_DSN');
  });


  it('should configure scope', function() {

    // given
    const setTagSpy = sinon.spy();

    const config = mockConfig({
      'editor.id': 'TEST_EDITOR_ID',
      'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true }
    });
    const flags = mockFlags();
    const renderer = mockRenderer();
    const Sentry = mockSentry({ setTagSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const calls = setTagSpy.getCalls();

    // then
    expect(calls[0]).to.have.been.calledWith({ key: 'editor-id', value: 'TEST_EDITOR_ID' });
    expect(calls[1]).to.have.been.calledWith({ key: 'is-backend-error', value: true });
    expect(calls[2]).to.have.been.calledWith({ key: 'platform', value: os.platform() });
    expect(calls[3]).to.have.been.calledWith({ key: 'os-version', value: os.release() });
  });


  it('should configure user', function() {

    // given
    const setUserSpy = sinon.spy();

    const config = mockConfig({
      'editor.id': 'TEST_EDITOR_ID',
      'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true }
    });
    const flags = mockFlags();
    const renderer = mockRenderer();
    const Sentry = mockSentry({ setUserSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    // then
    expect(setUserSpy).to.have.been.calledWith({
      id: 'TEST_EDITOR_ID'
    });
  });


  it('should listen to frontend', function() {

    // given
    const rendererSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags();
    const renderer = mockRenderer(rendererSpy);
    const Sentry = mockSentry();

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const calls = rendererSpy.getCalls();

    // then
    expect(calls[0].args[0]).to.eql('errorTracking:turnedOn');
    expect(calls[1].args[0]).to.eql('errorTracking:turnedOff');
  });


  it('should turn on', function() {

    // given
    const sentryInitSpy = sinon.spy();
    const rendererSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags();
    const renderer = mockRenderer(rendererSpy);
    const Sentry = mockSentry({ sentryInitSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const calls = rendererSpy.getCalls();

    calls[0].args[1]();

    // then
    expect(sentryInitSpy).to.have.been.calledTwice;
  });


  it('should turn off', function() {

    // given
    const sentryCloseSpy = sinon.spy();
    const rendererSpy = sinon.spy();

    const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
    const flags = mockFlags();
    const renderer = mockRenderer(rendererSpy);
    const Sentry = mockSentry({ sentryCloseSpy });

    // when
    errorTracking.start(Sentry, 'v2', config, flags, renderer);

    const calls = rendererSpy.getCalls();

    calls[1].args[1]();

    // then
    expect(sentryCloseSpy).to.have.been.called;
  });


  describe('#setTag', function() {

    it('should set tag when error tracking is active on start', function() {

      // given
      const setTagSpy = sinon.spy();

      const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': true } });
      const flags = mockFlags();
      const renderer = mockRenderer();
      const Sentry = mockSentry({ setTagSpy });

      // when
      errorTracking.start(Sentry, 'v2', config, flags, renderer);
      errorTracking.setTag(Sentry, 'key', 'value');

      // then
      expect(setTagSpy).to.have.been.calledWith({ key: 'key', value: 'value' });
    });


    it('should set tag when error tracking is restarted', function() {

      // given
      const rendererSpy = sinon.spy();
      const setTagSpy = sinon.spy();

      const config = mockConfig({ 'editor.privacyPreferences': { 'ENABLE_CRASH_REPORTS': false } });
      const flags = mockFlags();
      const renderer = mockRenderer(rendererSpy);
      const Sentry = mockSentry({ setTagSpy });

      // when
      errorTracking.start(Sentry, 'v2', config, flags, renderer);

      const calls = rendererSpy.getCalls();

      errorTracking.setTag(Sentry, 'key', 'value');

      // then
      expect(setTagSpy).not.to.have.been.called;

      // when
      calls[0].args[1]();

      // then
      expect(setTagSpy).to.have.been.calledWith({ key: 'key', value: 'value' });
    });
  });
});

function mockConfig(valuesByKey = {}) {
  return {
    get: function(key) {
      return valuesByKey[key];
    }
  };
}

function mockFlags(valuesByKey = {}) {
  return {
    get: function(key) {
      return valuesByKey[key];
    }
  };
}

function mockRenderer(spy) {
  return {
    on: function(key, callback) {
      if (spy) {
        spy(key, callback);
      }
    }
  };
}

function mockSentry(props = {}) {
  return {
    init: (initParam) => {
      if (props.sentryInitSpy) {
        props.sentryInitSpy(initParam);
      }
    },
    setTag: (key, value) => {
      if (props.setTagSpy) {
        props.setTagSpy({ key, value });
      }
    },
    setUser: (user) => {
      if (props.setUserSpy) {
        props.setUserSpy(user);
      }
    },
    close: () => {
      if (props.sentryCloseSpy) {
        props.sentryCloseSpy();
      }
    }
  };
}
