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

import DeploymentConnectionValidator from '../DeploymentConnectionValidator';

import * as TARGET_TYPES from '../../shared/ZeebeTargetTypes';

describe('DeploymentConnectionValidator', function() {

  describe('#validateConnection', function() {

    it('should validate connection (success=true)', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().resolves({
          success: true
        })
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      const { success, reason } = await validator.validateConnection(config);

      // then
      expect(success).to.be.true;
      expect(reason).not.to.exist;

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
    });


    it('should validate connection (success=false)', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().resolves({
          success: false,
          reason: 'foo'
        })
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      const { success, reason } = await validator.validateConnection(config);

      // then
      expect(success).to.be.false;
      expect(reason).to.equal('foo');

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
    });


    it('should validate connection (error thrown)', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().rejects(new Error())
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      const { success, reason } = await validator.validateConnection(config);

      // then
      expect(success).to.be.false;
      expect(reason).to.equal('UNKNOWN');

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
    });

  });


  describe('#startConnectionValidation', function() {

    let clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });


    it('should start connection validation', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().resolves({ success: true })
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const validateConnectionResultSpy = sinon.spy();

      validator.on('validate-connection-result', validateConnectionResultSpy);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      validator.startConnectionValidation(config);

      await clock.tickAsync(5001);

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
      expect(validateConnectionResultSpy).to.have.been.calledOnce;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledThrice;
      expect(validateConnectionResultSpy).to.have.been.calledThrice;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });
    });


    it('should stop connection validation', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().resolves({ success: true })
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const validateConnectionResultSpy = sinon.spy();

      validator.on('validate-connection-result', validateConnectionResultSpy);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      validator.startConnectionValidation(config);

      await clock.tickAsync(5001);

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
      expect(validateConnectionResultSpy).to.have.been.calledOnce;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      validator.stopConnectionValidation();

      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledTwice;
    });


    it('should stop connection validation before starting', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().resolves({ success: true })
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const validateConnectionResultSpy = sinon.spy();

      validator.on('validate-connection-result', validateConnectionResultSpy);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      validator.startConnectionValidation(config);

      await clock.tickAsync(5001);

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
      expect(validateConnectionResultSpy).to.have.been.calledOnce;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      validator.startConnectionValidation({
        ...config,
        endpoint: {
          ...config.endpoint,
          camundaCloudClientId: 'baz'
        }
      });

      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledTwice;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });

      // when
      await clock.tickAsync(5001);

      // then
      expect(zeebeAPI.checkConnection).to.have.been.calledThrice;
      expect(validateConnectionResultSpy).to.have.been.calledThrice;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: true
      });
    });


    it('should start connection validation (error thrown)', async function() {

      // given
      const zeebeAPI = new MockZeebeAPI({
        checkConnection: sinon.stub().rejects(new Error())
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const validateConnectionResultSpy = sinon.spy();

      validator.on('validate-connection-result', validateConnectionResultSpy);

      const config = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      // when
      validator.startConnectionValidation(config);

      await clock.tickAsync(5001);

      expect(zeebeAPI.checkConnection).to.have.been.calledOnce;
      expect(zeebeAPI.checkConnection).to.have.been.calledWith(config.endpoint);
      expect(validateConnectionResultSpy).to.have.been.calledOnce;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: false,
        reason: 'UNKNOWN'
      });
    });


    it('should discard stale connection validation results', async function() {

      // given
      const config1 = {
        endpoint: {
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        }
      };

      const config2 = {
        ...config1,
        endpoint: {
          ...config1.endpoint,
          camundaCloudClientId: 'baz'
        }
      };

      const zeebeAPI = new MockZeebeAPI({
        checkConnection: (endpoint) => {
          return new Promise(resolve => {
            if (endpoint.camundaCloudClientId === 'foo') {

              console.log('promising foo', endpoint.camundaCloudClientId);
              setTimeout(() => {
                resolve({
                  success: true
                });
              }, 8000);
            } else if (endpoint.camundaCloudClientId === 'baz') {

              console.log('promising baz', endpoint.camundaCloudClientId);
              setTimeout(() => {
                resolve({
                  success: false,
                  reason: 'foo'
                });
              }, 1000);
            }
          });
        }
      });

      const validator = new DeploymentConnectionValidator(zeebeAPI);

      const validateConnectionResultSpy = sinon.spy();

      validator.on('validate-connection-result', validateConnectionResultSpy);

      // when
      validator.startConnectionValidation(config1);
      setTimeout(() => {
        validator.startConnectionValidation(config2);
      }, 6000);

      /**
       * Response for 1st config will be received after 13s (5s interval delay + 8s response time).
       * Response for 2nd config will be received after 12s (6s initial delay + 5s interval delay + 1s response time).
       */
      await clock.tickAsync(13000);

      // then
      expect(validateConnectionResultSpy).to.have.been.calledOnce;
      expect(validateConnectionResultSpy).to.have.been.calledWith({
        success: false,
        reason: 'foo'
      });
    });

  });

});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockZeebeAPI extends Mock {}