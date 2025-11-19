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

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

describe('Deployment', function() {

  describe('#deploy', function() {

    it('should deploy (one file)', async function() {

      // given
      const resourceConfig = createMockResourceConfigs().pop(),
            config = createMockConfig(),
            deploymentResult = createMockDeploymentResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      // when
      await deployment.deploy(resourceConfig, config);

      // then
      expect(zeebeAPI.deploy).to.have.been.calledOnce;
      expect(zeebeAPI.deploy).to.have.been.calledWith({
        endpoint,
        resourceConfigs: [
          resourceConfig
        ]
      });

      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'deploymentTool',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should deploy (many files)', async function() {

      // given
      const resourceConfigs = createMockResourceConfigs(),
            config = createMockConfig(),
            deploymentResult = createMockDeploymentResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      // when
      await deployment.deploy(resourceConfigs, config);

      // then
      expect(zeebeAPI.deploy).to.have.been.calledOnce;
      expect(zeebeAPI.deploy).to.have.been.calledWith({
        endpoint,
        resourceConfigs
      });

      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'deploymentTool',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should deploy with tenant ID', async function() {

      // given
      const resourceConfigs = createMockResourceConfigs(),
            config = createMockConfig({
              endpoint: createMockEndpoint({ tenantId: 'foo' })
            }),
            deploymentResult = createMockDeploymentResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      // when
      await deployment.deploy(resourceConfigs, config);

      // then
      expect(zeebeAPI.deploy).to.have.been.calledOnce;
      expect(zeebeAPI.deploy).to.have.been.calledWith({
        endpoint,
        resourceConfigs,
      });

      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'deploymentTool',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should deploy with context', async function() {

      // given
      const resourceConfigs = createMockResourceConfigs(),
            config = createMockConfig({
              context: 'taskTesting'
            }),
            deploymentResult = createMockDeploymentResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      // when
      await deployment.deploy(resourceConfigs, config);

      // then
      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'taskTesting',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should register additional resources provider', async function() {

      // given
      const resourceConfig = createMockResourceConfigs().pop(),
            config = createMockConfig(),
            deploymentResult = createMockDeploymentResult({
              response: {
                key: 'foo',
                deployments: [
                  {
                    process: {
                      bpmnProcessId: 'Process_1',
                      processDefinitionKey: 'bar',
                      resourceName: 'foo.bpmn',
                      tenantId: '<default>',
                      version: 1
                    }
                  },
                  {
                    decision: {
                      decisionDefinitionId: 'Decision_1',
                      decisionDefinitionKey: 'baz',
                      name: 'Bar',
                      tenantId: '<default>',
                      version: 1
                    }
                  }
                ],
                tenantId: '<default>'
              }
            });

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      const additionalResourceConfigs = createMockResourceConfigs([ createMockFile({
        name: 'bar.dmn',
        path: '/baz/bar/bar.dmn'
      }) ]);

      deployment.registerResourcesProvider((previousResourceConfigs) => {
        return [
          ...previousResourceConfigs,
          ...additionalResourceConfigs
        ];
      });

      // when
      await deployment.deploy(resourceConfig, config);

      // then
      expect(zeebeAPI.deploy).to.have.been.calledOnce;
      expect(zeebeAPI.deploy).to.have.been.calledWith({
        endpoint,
        resourceConfigs: [
          resourceConfig,
          ...additionalResourceConfigs
        ]
      });

      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'deploymentTool',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should unregister additional resources provider', async function() {

      // given
      const resourceConfig = createMockResourceConfigs().pop(),
            config = createMockConfig(),
            deploymentResult = createMockDeploymentResult();

      const { endpoint } = config;

      const zeebeAPI = new MockZeebeAPI({
        deploy: sinon.stub().resolves(deploymentResult),
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      });

      const deployment = createDeployment({
        zeebeAPI
      });

      const deployedSpy = sinon.spy();

      deployment.on('deployed', deployedSpy);

      const additionalResourceConfigs = createMockResourceConfigs([ createMockFile({
        name: 'bar.dmn',
        path: '/baz/bar/bar.dmn'
      }) ]);

      const provider = (previousResourceConfigs) => {
        return [
          ...previousResourceConfigs,
          ...additionalResourceConfigs
        ];
      };

      deployment.registerResourcesProvider(provider);

      // when
      deployment.unregisterResourcesProvider(provider);

      await deployment.deploy(resourceConfig, config);

      // then
      expect(zeebeAPI.deploy).to.have.been.calledOnce;
      expect(zeebeAPI.deploy).to.have.been.calledWith({
        endpoint,
        resourceConfigs: [
          resourceConfig
        ]
      });

      expect(deployedSpy).to.have.been.calledOnce;
      expect(deployedSpy).to.have.been.calledWith({
        context: 'deploymentTool',
        deploymentResult,
        endpoint,
        gatewayVersion: 'foo'
      });
    });


    it('should fail deployment if no endpoint configured', async function() {

      // given
      const resourceConfig = createMockResourceConfigs().pop(),
            deployment = createDeployment();

      // when
      const result = await deployment.deploy(resourceConfig, null);

      // then
      expect(result).to.eql({
        success: false,
        response: {
          message: 'No connection configured.'
        }
      });
    });
  });


  it('should get gateway version', async function() {

    // given
    const deployment = createDeployment({
      zeebeAPI: new MockZeebeAPI({
        getGatewayVersion: sinon.stub().resolves({
          success: true,
          response: {
            gatewayVersion: 'foo'
          }
        })
      })
    });

    // when
    const gatewayVersion = await deployment.getGatewayVersion(createMockEndpoint());

    // expect
    expect(gatewayVersion).to.equal('foo');
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
    path: '/baz/bar/foo.bpmn',
    ...overrides
  };
}

function createMockResourceConfigs(files = [ createMockFile() ]) {
  return files.map(file => {
    return {
      path: file.path,
      type: file.path.split('.').pop()
    };
  });
}

function createMockDeploymentResult(overrides = {}) {
  return {
    success: true,
    response: {
      key: 'foo',
      deployments: [
        {
          process: {
            bpmnProcessId: 'Process_1',
            processDefinitionKey: 'bar',
            resourceName: 'foo.bpmn',
            tenantId: '<default>',
            version: 1
          }
        }
      ],
      tenantId: '<default>'
    },
    ...overrides
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
    context: 'deploymentTool',
    deployment: {},
    endpoint: createMockEndpoint(),
    ...overrides
  };
}
