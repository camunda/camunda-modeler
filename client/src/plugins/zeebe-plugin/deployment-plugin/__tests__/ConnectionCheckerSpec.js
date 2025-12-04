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

import ConnectionChecker from '../ConnectionChecker';

import { TARGET_TYPES } from '../../../../remote/ZeebeAPI';
import { CONNECTION_CHECK_ERROR_REASONS } from '../ConnectionCheckErrors';

describe('ConnectionChecker', function() {

  let clock,
      connectionChecker;

  beforeEach(function() {
    clock = sinon.useFakeTimers();

    connectionChecker = new ConnectionChecker();
  });

  afterEach(function() {
    clock.restore();

    connectionChecker.stopChecking();
  });


  it('should initialize with no config', function() {
    expect(connectionChecker._config).to.be.null;
  });


  it('should update config and check connection after 1000ms (success=true)', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.stub().resolves({
        success: true
      })
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).not.have.been.called;

    await clock.tickAsync(1001);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true,
      name: 'default'
    });
  });


  it('should update config and check connection after 1000s (success=false)', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.stub().resolves({
        success: false,
        reason: 'foo'
      })
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).not.have.been.called;

    await clock.tickAsync(1001);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      reason: 'foo',
      name: 'default'
    });
  });


  it('should update config and check connection after 1000ms (error thrown)', async function() {

    // given
    const error = new Error('Connection error');

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.stub().rejects(error)
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).not.have.been.called;

    await clock.tickAsync(1001);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      error,
      name: 'default'
    });
  });


  it('should update config and start checking every 5000ms be default', async function() {

    // given
    let success = true;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        if (success) {
          resolve({
            success: true
          });
        } else {
          resolve({
            success: false,
            reason: 'foo'
          });
        }
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).not.have.been.called;

    await clock.tickAsync(1000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true,
      name: 'default'
    });

    // when
    success = false;

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      reason: 'foo',
      name: 'default'
    });

    // when
    success = true;

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.called.callCount(3);
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.called.callCount(3);
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true,
      name: 'default'
    });
  });


  it('should check after 1000ms and clear previous interval and timeout when updating config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.stub().resolves({
        success: true
      })
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).not.have.been.called;

    await clock.tickAsync(500);

    // then
    expect(zeebeAPI.checkConnection).to.not.have.been.called;

    // when
    connectionChecker.updateConfig({
      ...DEFAULT_CONFIG,
      endpoint: {
        ...DEFAULT_CONFIG.endpoint,
        camundaCloudClientId: 'bar'
      }
    });

    await clock.tickAsync(1000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith({
      ...DEFAULT_CONFIG.endpoint,
      camundaCloudClientId: 'bar'
    });

    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true,
      name: 'default'
    });

    // when
    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith({
      ...DEFAULT_CONFIG.endpoint,
      camundaCloudClientId: 'bar'
    });
  });


  it('should start checking (no config)', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    await connectionChecker.startChecking();

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy.firstCall.args[0].success).to.be.false;
    expect(connectionCheckSpy.firstCall.args[0].reason).to.equal(CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG);
  });


  it('should emit INVALID_CONFIGURATION error for invalid endpoint config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when - update with invalid config (missing client secret)
    await connectionChecker.updateConfig({
      endpoint: {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
        camundaCloudClientId: 'foo',
        camundaCloudClientSecret: '', // empty = invalid
        camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
      }
    });

    await clock.tickAsync(1001);

    // then - should not call API
    expect(zeebeAPI.checkConnection).not.have.been.called;

    // should emit INVALID_CONFIGURATION error
    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy.firstCall.args[0].success).to.be.false;
    expect(connectionCheckSpy.firstCall.args[0].reason).to.equal(CONNECTION_CHECK_ERROR_REASONS.INVALID_CONFIGURATION);
    expect(connectionCheckSpy.firstCall.args[0].validationErrors).to.have.property('camundaCloudClientSecret');
  });


  it('should stop checking', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledOnce;

    // when
    connectionChecker.stopChecking();

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
  });


  it('should not emit result when check is aborted during config update', async function() {

    // given
    let resolveCheck;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        resolveCheck = resolve;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(1000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(connectionCheckSpy).not.to.have.been.called;

    // when - update config while check is in progress
    connectionChecker.updateConfig({
      ...DEFAULT_CONFIG,
      endpoint: {
        ...DEFAULT_CONFIG.endpoint,
        camundaCloudClientId: 'new-client-id'
      }
    });

    // resolve the first check after abort
    resolveCheck({
      success: true
    });

    await flushPromises();

    // then - aborted check result should not be emitted
    expect(connectionCheckSpy).not.to.have.been.called;
  });


  it('should not emit result when check is aborted during stopChecking', async function() {

    // given
    let resolveCheck;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        resolveCheck = resolve;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(1000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(connectionCheckSpy).not.to.have.been.called;

    // when - stop checking while check is in progress
    connectionChecker.stopChecking();

    // resolve the check after abort
    resolveCheck({
      success: true
    });

    await flushPromises();

    // then - aborted check result should not be emitted
    expect(connectionCheckSpy).not.to.have.been.called;
  });


  it('should prevent concurrent checks', async function() {

    // given
    let resolveFirstCheck, resolveSecondCheck;
    let callCount = 0;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        if (callCount === 0) {
          resolveFirstCheck = resolve;
        } else {
          resolveSecondCheck = resolve;
        }
        callCount++;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG, false);

    await clock.tickAsync(1000);

    // then - first check starts
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(connectionCheckSpy).not.to.have.been.called;

    // when - try to trigger another check while first is in progress
    connectionChecker._check(); // returns immediately due to _isChecking guard

    await flushPromises();

    // then - second check should not start (returns immediately due to _isChecking guard)
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;

    // when - resolve first check
    resolveFirstCheck({
      success: true
    });

    await flushPromises();

    // then - first check result should be emitted
    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true,
      name: 'default'
    });

    // when - trigger another check after first completes
    connectionChecker._check();

    await flushPromises();

    // then - second check should now start
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;

    // when - resolve second check
    resolveSecondCheck({
      success: false,
      reason: 'test'
    });

    await flushPromises();

    // then - second check result should be emitted
    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy.secondCall).to.have.been.calledWith({
      success: false,
      reason: 'test',
      name: 'default'
    });
  });


  it('should preserve last result when check is aborted', async function() {

    // given
    let resolveFirstCheck, resolveSecondCheck;
    let callCount = 0;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        if (callCount === 0) {
          resolveFirstCheck = resolve;
        } else {
          resolveSecondCheck = resolve;
        }
        callCount++;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when - first check
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(1000);

    // Wait for checkConnection to be called
    await flushPromises();

    resolveFirstCheck({
      success: true
    });

    await flushPromises();

    // then
    expect(connectionChecker.getLastResult()).to.deep.equal({
      success: true
    });

    // when - second check starts and gets aborted
    await clock.tickAsync(5000);

    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;

    connectionChecker.stopChecking();

    resolveSecondCheck({
      success: false,
      reason: 'should not update',
      name: 'default'
    });

    await flushPromises();

    // then - last result should still be from first check
    expect(connectionChecker.getLastResult()).to.deep.equal({
      success: true
    });

    expect(connectionCheckSpy).to.have.been.calledOnce;
  });


  it('should not emit error when check is aborted with error', async function() {

    // given
    let rejectCheck;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((_, reject) => {
        rejectCheck = reject;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(1000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(connectionCheckSpy).not.to.have.been.called;

    // when - stop checking while check is in progress
    connectionChecker.stopChecking();

    // reject the check after abort
    rejectCheck(new Error('Connection failed'));

    await flushPromises();

    // then - aborted check error should not be emitted
    expect(connectionCheckSpy).not.to.have.been.called;
  });


  it('should handle rapid config updates', async function() {

    // given
    let resolveChecks = [];
    let callCount = 0;

    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy(() => new Promise((resolve) => {
        resolveChecks[callCount] = resolve;
        callCount++;
      }))
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when - rapid config updates
    connectionChecker.updateConfig(DEFAULT_CONFIG);

    await clock.tickAsync(500);

    connectionChecker.updateConfig({
      ...DEFAULT_CONFIG,
      endpoint: {
        ...DEFAULT_CONFIG.endpoint,
        camundaCloudClientId: 'client-2'
      }
    });

    await clock.tickAsync(500);

    connectionChecker.updateConfig({
      ...DEFAULT_CONFIG,
      endpoint: {
        ...DEFAULT_CONFIG.endpoint,
        camundaCloudClientId: 'client-3'
      }
    });

    await clock.tickAsync(1000);

    // Wait for checkConnection to be called
    await flushPromises();

    // then - only last config should be checked
    expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
    expect(zeebeAPI.checkConnection.firstCall).to.have.been.calledWith({
      ...DEFAULT_CONFIG.endpoint,
      camundaCloudClientId: 'client-3'
    });

    // when - resolve the check
    resolveChecks[0]({
      success: true,
      name: 'default'
    });

    await flushPromises();

    // then - only one result should be emitted
    expect(connectionCheckSpy).to.have.been.calledOnce;
  });

});

const DEFAULT_CONFIG = {
  endpoint: {
    targetType: TARGET_TYPES.CAMUNDA_CLOUD,
    camundaCloudClientId: 'foo',
    camundaCloudClientSecret: 'bar',
    camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
  }
};

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockZeebeAPI extends Mock {}

async function flushPromises(iterations = 5) {
  let i = 0;
  while (i++ < iterations) {
    await Promise.resolve();
  }
}
