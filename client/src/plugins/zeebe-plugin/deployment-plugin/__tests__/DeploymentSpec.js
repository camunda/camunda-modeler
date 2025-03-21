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

/**
 * @typedef {import('../types').ConnectionCheckResult} ConnectionCheckResult
 * @typedef {import('../types').Endpoint} Endpoint
 */

import Deployment from '../Deployment';

import ZeebeAPI from '../../../../remote/ZeebeAPI';

describe('Deployment', function() {

  it('creates instance', function() {

    // when
    const deployment = createDeployment();

    // then
    expect(deployment).to.exist;
  });


  describe('deploy', function() {

    it('TODO');

  });


  describe('config', function() {

    it('should get config for file', async function() {

      // given
      const endpoint = createMockEndpoint();

      const backend = new MockBackend({
        send: sinon.stub().resolves({
          endpoints: [ endpoint ]
        })
      });

      const deployment = createDeployment({
        zeebeAPI: new ZeebeAPI(backend)
      });

      // when
      const config = await deployment.getConfigForFile(createMockFile);

      // then
      expect(config).to.eql({
        endpoints: [ endpoint ]
      });
    });


    it('should not get config for file', async function() {

      // given
      const backend = new MockBackend({
        send: sinon.stub().resolves({
          endpoints: []
        })
      });

      const deployment = createDeployment({
        zeebeAPI: new ZeebeAPI(backend)
      });

      // when
      const config = await deployment.getConfigForFile(createMockFile);

      // then
      expect(config).to.eql({
        endpoints: []
      });
    });

  });

});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockBackend extends Mock {
  send(event, ...args) {
    return Promise.resolve();
  }
}

class MockConfig extends Mock {
  get(key) {
    return {};
  }

  set(key, value) {
    return {};
  }

  getForFile(file) {
    return {};
  }

  setForFile(file, value) {
    return {};
  }
}

class MockConnectionChecker extends Mock {

  /**
   * @param {Endpoint} endpoint
   *
   * @returns {Promise<ConnectionCheckResult>}
   */
  check(endpoint) {
    return Promise.resolve({ endpointErrors: {} });
  }
}

class MockValidator extends Mock {}

function createDeployment(options = {}) {
  const backend = new MockBackend();


  const {
    config = new MockConfig(),
    connectionChecker = new MockConnectionChecker(),
    validator = new MockValidator(),
    zeebeAPI = new ZeebeAPI(backend)
  } = options;

  return new Deployment(config, zeebeAPI, validator, connectionChecker);
}

function createMockFile(overrides = {}) {
  return {
    name: 'foo.bpmn',
    ...overrides
  };
}

function createMockEndpoint(overrides = {}) {
  return {
    id: 'foo',
    url: 'http://foo.com',
    ...overrides
  };
}