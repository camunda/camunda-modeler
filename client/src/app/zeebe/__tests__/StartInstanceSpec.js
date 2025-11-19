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

import StartInstance, { CONFIG_KEYS } from '../StartInstance';

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

describe('StartInstance', function() {

  describe('#startInstance', function() {

    it('should start instance', async function() {

      // given
      const config = createMockConfig(),
            startInstanceResult = createMockStartInstanceResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        startInstance: sinon.stub().resolves(startInstanceResult)
      });

      const startInstance = createStartInstance({
        zeebeAPI
      });

      const instanceStartedSpy = sinon.spy();

      startInstance.on('instanceStarted', instanceStartedSpy);

      // when
      const result = await startInstance.startInstance('foo', config);

      // then
      expect(result).to.eql(startInstanceResult);

      expect(zeebeAPI.startInstance).to.have.been.calledOnce;
      expect(zeebeAPI.startInstance).to.have.been.calledWith({
        endpoint,
        processId: 'foo',
        variables: {
          foo: 'bar'
        },
        startInstructions: undefined,
        runtimeInstructions: undefined
      });

      expect(instanceStartedSpy).to.have.been.calledOnce;
      expect(instanceStartedSpy).to.have.been.calledWith({
        startInstanceResult,
        endpoint,
        processId: 'foo',
        variables: {
          foo: 'bar'
        }
      });
    });

  });


  describe('#getConfigForFile', function() {

    it('should get config for file', async function() {

      // given
      const startInstance = createStartInstance({
        config: new MockConfig({
          getForFile: sinon.stub().resolves({
            variables: JSON.stringify({
              foo: 'bar'
            })
          })
        })
      });

      // when
      const config = await startInstance.getConfigForFile(createMockFile());

      // then
      expect(config).to.eql({
        variables: JSON.stringify({
          foo: 'bar'
        })
      });
    });


    it('should get default config for file', async function() {

      // given
      const deployment = createStartInstance({
        config: new MockConfig({
          getForFile: sinon.stub().resolves(JSON.stringify({}))
        })
      });

      // when
      const config = await deployment.getConfigForFile(createMockFile());

      // then
      expect(config).to.eql({
        variables: JSON.stringify({})
      });
    });

  });


  describe('#setConfigForFile', function() {

    it('should set config for file', async function() {

      // given
      const { variables } = createMockConfig();

      const setForFileStub = sinon.stub().resolves(undefined);

      const startInstance = createStartInstance({
        config: new MockConfig({
          setForFile: setForFileStub
        })
      });

      const file = createMockFile();

      // when
      await startInstance.setConfigForFile(file, {
        variables
      });

      // then
      expect(setForFileStub).to.have.been.calledOnce;
      expect(setForFileStub).to.have.been.calledWith(
        file,
        CONFIG_KEYS.CONFIG,
        {
          variables: JSON.stringify({
            foo: 'bar'
          })
        }
      );
    });

  });

});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockConfig extends Mock {
  get(key, defaultValue) {
    return {};
  }

  set(key, value) {
    return undefined;
  }

  getForFile(file, key, defaultValue) {
    return {};
  }

  setForFile(file, value) {
    return undefined;
  }
}

class MockZeebeAPI extends Mock {
  checkConnection() {
    return Promise.resolve({});
  }

  deploy() {
    return Promise.resolve({});
  }

  getGatewayVersion() {
    return Promise.resolve({});
  }
}

function createStartInstance(options = {}) {
  const {
    config = new MockConfig(),
    zeebeAPI = new MockZeebeAPI()
  } = options;

  return new StartInstance(config, zeebeAPI);
}

function createMockFile(overrides = {}) {
  return {
    name: 'foo.bpmn',
    path: '/baz/bar/foo.bpmn',
    ...overrides
  };
}

function createMockStartInstanceResult(overrides = {}) {
  return {
    success: true,
    repsonse: {
      bpmnProcessId: 'Process_1',
      processDefinitionKey: 'foo',
      processInstanceKey: 'bar',
      tenantId: '<default>',
      version: 1
    }
  };
}

function createMockEndpoint(overrides = {}) {
  return {
    targetType: TARGET_TYPES.CAMUNDA_CLOUD,
    id: 'foo',
    camundaCloudClientId: 'bar',
    camundaCloudClientSecret: 'baz',
    camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443',
    ...overrides
  };
}

function createMockConfig(overrides = {}) {
  return {
    deployment: {},
    endpoint: createMockEndpoint(),
    variables: JSON.stringify({
      foo: 'bar'
    }),
    ...overrides
  };
}