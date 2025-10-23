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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true
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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      reason: 'foo'
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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      error
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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true
    });

    // when
    success = false;

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledThrice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.calledThrice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: false,
      reason: 'foo'
    });

    // when
    success = true;

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.called.callCount(4);
    expect(zeebeAPI.checkConnection).to.have.been.calledWith(DEFAULT_CONFIG.endpoint);

    expect(connectionCheckSpy).to.have.been.called.callCount(4);
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true
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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(zeebeAPI.checkConnection).to.have.been.calledWith({
      ...DEFAULT_CONFIG.endpoint,
      camundaCloudClientId: 'bar'
    });

    expect(connectionCheckSpy).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledWith({
      success: true
    });

    // when
    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledThrice;
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
    expect(connectionCheckSpy.firstCall.args[0].error.message).to.equal('No configuration provided');
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
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledTwice;

    // when
    connectionChecker.stopChecking();

    await clock.tickAsync(5000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
  });


  it('should not schedule checks when updating with no config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    // when
    connectionChecker.updateConfig(null);

    // assume
    expect(zeebeAPI.checkConnection).not.have.been.called;
    expect(connectionCheckSpy).not.have.been.called;

    // when
    await clock.tickAsync(1000);

    // when
    await clock.tickAsync(6000);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;
    expect(connectionCheckSpy).not.have.been.called;
  });


  it('should set lastResult with error when updating with no config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    // when
    connectionChecker.updateConfig(null);

    // then
    const lastResult = connectionChecker.getLastResult();
    expect(lastResult).to.exist;
    expect(lastResult.success).to.be.false;
    expect(lastResult.error).to.exist;
    expect(lastResult.error.message).to.equal('No configuration provided');
  });


  it('should not schedule checks when updating with invalid config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const connectionCheckSpy = sinon.spy();

    connectionChecker.on('connectionCheck', connectionCheckSpy);

    const invalidConfig = {
      endpoint: {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
      }
    };

    // when
    connectionChecker.updateConfig(invalidConfig);

    await clock.tickAsync(6000);

    // then
    expect(zeebeAPI.checkConnection).not.have.been.called;
    expect(connectionCheckSpy).not.have.been.called;
  });


  it('should set lastResult with error when updating with invalid config', async function() {

    // given
    const zeebeAPI = new MockZeebeAPI({
      checkConnection: sinon.spy()
    });

    const connectionChecker = new ConnectionChecker(zeebeAPI);

    const invalidConfig = {
      endpoint: {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
      }
    };

    // when
    connectionChecker.updateConfig(invalidConfig);

    // then
    const lastResult = connectionChecker.getLastResult();
    expect(lastResult).to.exist;
    expect(lastResult.success).to.be.false;
    expect(lastResult.error).to.exist;
    expect(lastResult.error.message).to.equal('Configuration is invalid');
  });


  it('should not continue checking after config becomes invalid', async function() {

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

    await clock.tickAsync(1000);

    // assume
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledTwice;

    // when
    const invalidConfig = {
      endpoint: {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
      }
    };

    connectionChecker.updateConfig(invalidConfig);

    await clock.tickAsync(6000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledTwice;
  });


  it('should not continue checking after config is cleared', async function() {

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

    await clock.tickAsync(1000);

    // assume
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledTwice;

    // when
    connectionChecker.updateConfig(null);

    await clock.tickAsync(6000);

    // then
    expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
    expect(connectionCheckSpy).to.have.been.calledTwice;
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