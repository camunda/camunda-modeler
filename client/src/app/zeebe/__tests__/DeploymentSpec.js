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


  describe('#getEndpoints', function() {

    it('should return empty array when settings returns null', function() {

      // given
      const settings = {
        get: sinon.stub().returns(null)
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns undefined', function() {

      // given
      const settings = {
        get: sinon.stub().returns(undefined)
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns non-array value', function() {

      // given
      const settings = {
        get: sinon.stub().returns('invalid string')
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should return empty array when settings returns object', function() {

      // given
      const settings = {
        get: sinon.stub().returns({ corrupted: 'object' })
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal([]);
    });


    it('should filter out connections without id', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          name: 'Valid Connection 1',
          url: 'http://localhost:8080'
        },
        {
          name: 'Connection without ID',
          url: 'http://localhost:8081'
        },
        {
          id: '',
          name: 'Connection with empty ID',
          url: 'http://localhost:8082'
        },
        {
          id: 'connection-2',
          name: 'Valid Connection 2',
          url: 'http://localhost:8083'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.have.length(2);
      expect(endpoints[0]).to.have.property('id', 'connection-1');
      expect(endpoints[1]).to.have.property('id', 'connection-2');
    });


    it('should return valid connections array from settings', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          name: 'Test Connection 1',
          url: 'http://localhost:8080'
        },
        {
          id: 'connection-2',
          name: 'Test Connection 2',
          url: 'http://localhost:8081'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createDeployment({ settings });

      // when
      const endpoints = deployment.getEndpoints();

      // then
      expect(endpoints).to.deep.equal(connections);
    });
  });


  describe('#getDefaultEndpoint', function() {

    it('should return c8run connection when it exists', function() {

      // given
      const connections = [
        {
          id: 'other-connection',
          name: 'Production',
          contactPoint: 'https://example.com'
        },
        {
          id: 'c8run-test-id',
          name: 'c8run (local)',
          contactPoint: 'http://localhost:8080/v2'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createDeployment({ settings });

      // when
      const result = deployment.getDefaultEndpoint();

      // then
      expect(result).to.exist;
      expect(result.id).to.equal('c8run-test-id');
      expect(result.name).to.equal('c8run (local)');
    });


    it('should return first c8run if multiple exist', function() {

      // given
      const connections = [
        {
          id: 'c8run-1',
          name: 'c8run (local)',
          contactPoint: 'http://localhost:8080/v2'
        },
        {
          id: 'c8run-2',
          name: 'c8run - dev',
          contactPoint: 'http://localhost:8080/operate'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createDeployment({ settings });

      // when
      const result = deployment.getDefaultEndpoint();

      // then
      expect(result).to.exist;
      expect(result.id).to.equal('c8run-1');
    });


    it('should return null when no connections exist', function() {

      // given
      const settings = {
        get: sinon.stub().returns([])
      };

      const deployment = createDeployment({ settings });

      // when
      const result = deployment.getDefaultEndpoint();

      // then
      expect(result).to.be.null;
    });


    it('should return null when no c8run connection exists', function() {

      // given
      const connections = [
        {
          id: 'prod-1',
          name: 'Production',
          contactPoint: 'https://example.com'
        },
        {
          id: 'staging-1',
          name: 'Staging',
          contactPoint: 'https://staging.example.com'
        }
      ];

      const settings = {
        get: sinon.stub().returns(connections)
      };

      const deployment = createDeployment({ settings });

      // when
      const result = deployment.getDefaultEndpoint();

      // then
      expect(result).to.be.null;
    });
  });


  describe('#getConnectionForTab', function() {

    it('should return NO_CONNECTION without tab', async function() {

      // given
      const deployment = createDeployment();

      // when
      const result = await deployment.getConnectionForTab();

      // then
      expect(result.id).to.equal('NO_CONNECTION');
    });


    it('should return NO_CONNECTION without tab.file', async function() {

      // given
      const deployment = createDeployment();

      // when
      const result = await deployment.getConnectionForTab({ file: undefined });

      // then
      expect(result.id).to.equal('NO_CONNECTION');
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

class MockTabStorage extends Mock {
  constructor() {
    super();
    this._storage = new Map();
  }

  get(tab, key, defaultValue = null) {
    const tabData = this._storage.get(tab.id);
    if (!tabData) {
      return defaultValue;
    }
    const value = tabData[key];
    return value !== undefined ? value : defaultValue;
  }

  set(tab, key, value) {
    const tabId = tab.id;
    if (!this._storage.has(tabId)) {
      this._storage.set(tabId, {});
    }
    const tabData = this._storage.get(tabId);
    tabData[key] = value;
  }

  getAll(tab) {
    return this._storage.get(tab.id) || {};
  }

  removeTab(tabId) {
    this._storage.delete(tabId);
  }

  clear() {
    this._storage.clear();
  }
}


function createDeployment(options = {}) {
  const {
    tabStorage = new MockTabStorage(),
    config = new MockConfig(),
    zeebeAPI = new MockZeebeAPI(),
    settings = { get: () => [] }
  } = options;

  return new Deployment(tabStorage, config, zeebeAPI, settings);
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
    camundaCloudClusterUrl: 'https://my-cluster-id.bru-2.zeebe.camunda.io:443',
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
