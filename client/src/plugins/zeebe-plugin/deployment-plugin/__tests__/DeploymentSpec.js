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

import Deployment from '../Deployment';

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

      const deployment = createDeployment({
        config: new MockConfig({
          getForFile: sinon.stub().resolves({
            endpoints: [ endpoint ]
          })
        })
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
      const deployment = createDeployment({
        config: new MockConfig({
          getForFile: sinon.stub().resolves({
            endpoints: []
          })
        })
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

class MockZeebeAPI extends Mock {}

function createDeployment(options = {}) {
  const {
    config = new MockConfig(),
    zeebeAPI = new MockZeebeAPI()
  } = options;

  return new Deployment(config, zeebeAPI);
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