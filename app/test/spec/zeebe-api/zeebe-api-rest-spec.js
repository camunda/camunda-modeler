/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const ZeebeAPI = require('../../../lib/zeebe-api');

const TEST_URL = 'https://reg-1.zeebe.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

const {
  AUTH_TYPES,
  ENDPOINT_TYPES
} = require('../../../lib/zeebe-api/constants');

const { setupPlatformStub } = require('./helper');


describe('ZeebeAPI (REST)', function() {


  // TODO(barmac): remove when system keychain certificates are tested
  setupPlatformStub();


  describe('#checkConnection', function() {

    it('should set success=true if check successful', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should set protocol and gatewayVersion if check successful', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.response).to.exist;
      expect(result.response.protocol).to.equal('rest');
      expect(result.response.gatewayVersion).to.equal('8.7.0');
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          getTopology: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.false;
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable> (Cloud) - error 14', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('TEST ERROR.', 14);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('TEST ERROR.', 13);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <not-found> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('ENOTFOUND');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });




      it('for <unauthorized> - Cloud', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Unauthorized');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Forbidden');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Unsupported protocol');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <unknown>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Some random error');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for no message', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError();
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for <Method not found>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Method not found', 12);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        // then
        expect(result.reason).to.eql('UNSUPPORTED_ENGINE');

      });

    });

  });


  describe('#startInstance', function() {

    it('should set success=true on success', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.startInstance(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          createProcessInstance: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.startInstance(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.false;
      expect(result.response).to.exist;
      expect(result.response.message).to.be.eql('TEST ERROR.');
    });


    it('should return serialized error', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          createProcessInstance: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.startInstance(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).not.to.be.instanceOf(Error);
    });

  });


  describe('#deploy', function() {

    it('should set success=true for successful deployment', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: './foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      const result = await zeebeAPI.deploy(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });


    it('should set success=false for failure', async function() {

      // given
      const error = new Error('test');

      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          deployResources: function() {
            throw error;
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: './foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      const result = await zeebeAPI.deploy(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.false;
      expect(result.response).to.exist;
    });


    it('should return serialized error', async function() {

      // given
      const error = new Error('test');

      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          deployResources: function() {
            throw error;
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: './foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      const result = await zeebeAPI.deploy(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).not.to.be.instanceOf(Error);
    });


    it('should read file as buffer', async function() {

      // given
      const fs = {
        readFile: sinon.spy(() => ({}))
      };

      const zeebeAPI = createZeebeAPI({ fs });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: './foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(fs.readFile).to.have.been.calledOnce;
      expect(fs.readFile.args).to.eql([
        [ parameters.resourceConfigs[0].path, { encoding: false } ]
      ]);
    });


    describe('resource types', function() {

      it('should deploy BPMN', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].content).to.exist;
        expect(args[0][0].content).to.be.an.instanceOf(Buffer);
      });


      it('should deploy DMN', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.dmn',
              type: 'dmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].content).to.exist;
        expect(args[0][0].content).to.be.an.instanceOf(Buffer);
      });


      it('should deploy form', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.form',
              type: 'form'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].content).to.exist;
        expect(args[0][0].content).to.be.an.instanceOf(Buffer);
      });

    });


    describe('compatibility', function() {

      it('should map BPMN deployment result so that bpmnProcessId is available', async function() {

        // given
        const deploymentResult = {
          deployments: [
            {
              processDefinition: {
                processDefinitionId: 'processId',
                processDefinitionVersion: '0',
                processDefinitionKey: '2251799813686749'
              }
            }
          ]
        };

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: () => deploymentResult
          }
        });

        // when
        const result = await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        });

        // then
        expect(result.response.deployments[0].process).to.exist;
        expect(result.response.deployments[0].process).to.have.property('bpmnProcessId', 'processId');
      });


      it('should map DMN deployment result so that decisionId is available', async function() {

        // given
        const deploymentResult = {
          deployments: [
            {
              decisionDefinition: {
                decisionDefinitionId: 'decisionId',
                decisionRequirementsId: 'string',
                decisionDefinitionKey: '2251799813326547'
              }
            }
          ]
        };

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: () => deploymentResult
          }
        });

        // when
        const result = await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.dmn',
              type: 'dmn'
            }
          ]
        });

        // then
        expect(result.response.deployments[0].decision).to.exist;
        expect(result.response.deployments[0].decision).to.have.property('decisionId', 'decisionId');
      });


      it('should map response to include all values from a grpc response', async function() {

        // given
        const restDeploymentResponse = {
          'deploymentKey': '999',
          'deployments': [
            {
              'processDefinition': {
                'processDefinitionId': 'Process_1',
                'processDefinitionKey': '111',
                'processDefinitionVersion': 1,
                'resourceName': 'diagram_1.bpmn',
                'tenantId': '<default>'
              }
            },
            {
              'decisionDefinition': {
                'decisionDefinitionId': 'Decision_2',
                'decisionDefinitionKey': '222',
                'decisionRequirementsId': 'Definitions_3',
                'decisionRequirementsKey': '333',
                'name': 'Decision 2',
                'tenantId': '<default>',
                'version': 1
              }
            },
            {
              'decisionRequirements': {
                'decisionRequirementsId': 'Definitions_3',
                'decisionRequirementsKey': '333',
                'decisionRequirementsName': 'DRD',
                'resourceName': 'diagram_2.dmn',
                'tenantId': '<default>',
                'version': 1
              }
            },
            {
              'form': {
                'formId': 'Form_4',
                'formKey': '444',
                'resourceName': 'form_4.form',
                'tenantId': '<default>',
                'version': 1
              }
            }
          ],
          'tenantId': '<default>'
        };

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: () => restDeploymentResponse
          }
        });

        // when
        const result = await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'diagram_1.bpmn',
              type: 'bpmn'
            },
            {
              path: 'diagram_2.dmn',
              type: 'dmn'
            },
            {
              path: 'form_4.form',
              type: 'form'
            }
          ]
        });

        // then
        const grpcDeploymentResponse = {
          'deployments': [
            {
              'process': {
                'bpmnProcessId': 'Process_1',
                'processDefinitionKey': '111',
                'resourceName': 'diagram_1.bpmn',
                'tenantId': '<default>',
                'version': 1
              }
            },
            {
              'decision': {
                'decisionKey': '222',
                'decisionRequirementsKey': '333',
                'dmnDecisionId': 'Decision_2',
                'dmnDecisionName': 'Decision 2',
                'dmnDecisionRequirementsId': 'Definitions_3',
                'tenantId': '<default>',
                'version': 1
              }
            },
            {
              'decisionRequirements': {
                'decisionRequirementsKey': '333',
                'dmnDecisionRequirementsId': 'Definitions_3',
                'dmnDecisionRequirementsName': 'DRD',
                'resourceName': 'diagram_2.dmn',
                'tenantId': '<default>',
                'version': 1
              }
            },
            {
              'form': {
                'formId': 'Form_4',
                'formKey': '444',
                'resourceName': 'form_4.form',
                'tenantId': '<default>',
                'version': 1
              }
            },
          ],
          'key': '999',
          'tenantId': '<default>'
        };

        expect((result.response)).to.containSubset(grpcDeploymentResponse);
      });
    });


    describe('resource names', function() {

      it('should use file path as resource name', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'process.bpmn',
              type: 'bpmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('process.bpmn');
      });


      it('should add .bpmn extension to resource name if extension not .bpmn', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.xml',
              type: 'bpmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo.bpmn');
      });


      it('should add .bpmn extension to resource name if file path ends with bpmn but not .bpmn', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo-bpmn',
              type: 'bpmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo-bpmn.bpmn');
      });


      it('should add .dmn extension to resource name if extension not .dmn', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.xml',
              type: 'dmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo.dmn');
      });


      it('should add .dmn extension to resource name if file path ends with dmn but not .dmn', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo-dmn',
              type: 'dmn'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo-dmn.dmn');
      });


      it('should add .form extension to resource name if extension not .form', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.json',
              type: 'form'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo.form');
      });


      it('should add .form extension to resource name if name ends with form but not .form', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo-form',
              type: 'form'
            }
          ]
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].name).to.eql('foo-form.form');
      });

    });


    describe('basic auth', function() {

      it('should pass configuration', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const configSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          configSpy,
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            url: TEST_URL,
            basicAuthUsername: 'username',
            basicAuthPassword: 'password'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        });

        // then
        const [ config ] = configSpy.getCall(0).args;

        // REST Client is invoked accordingly
        expect(config.ZEEBE_REST_ADDRESS).to.eql(TEST_URL);

        expect(config).to.include.keys({
          ZEEBE_REST_ADDRESS: 'url',
          CAMUNDA_AUTH_STRATEGY: 'basic',
          CAMUNDA_BASIC_AUTH_USERNAME: 'username',
          CAMUNDA_BASIC_AUTH_PASSWORD: 'password'
        });

        // deployment is executed appropriately
        expect(deployResourcesSpy).to.have.been.calledWithMatch([ { name: 'foo.bpmn', content: sinon.match.instanceOf(Buffer) } ]);
      });

    });


    describe('OAuth', function() {

      it('should pass configuration', async function() {

        // given
        const configSpy = sinon.spy();
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          configSpy,
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            audience: 'audience',
            scope: 'scope',
            clientId: 'clientId',
            clientSecret: 'clientSecret'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        });

        // then
        const config = configSpy.getCall(0).args[0];

        // REST Client is invoked accordingly
        expect(config.ZEEBE_REST_ADDRESS).to.eql(TEST_URL);

        expect(config).to.include.keys({
          CAMUNDA_AUTH_STRATEGY: 'OAUTH',
          CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'audience',
          ZEEBE_CLIENT_ID: 'clientId',
          ZEEBE_CLIENT_SECRET: 'clientSecret',
          CAMUNDA_TOKEN_SCOPE: 'scope',
          CAMUNDA_OAUTH_URL: 'oauthURL',
          CAMUNDA_TOKEN_DISK_CACHE_DISABLE: 'true'
        });

        // deployment is executed appropriately
        expect(deployResourcesSpy).to.have.been.calledWithMatch([ { name: 'foo.bpmn', content: sinon.match.instanceOf(Buffer) } ]);
      });

    });


    describe('tenant ID', function() {

      it('should add tenant ID (single file)', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            clientId: 'clientId',
            clientSecret: 'clientSecret'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ],
          tenantId: 'bar'
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        // For REST API, tenantId is passed as second argument to deployResources
        expect(args[1]).to.eql('bar');
      });


      it('should add tenant ID (multiple files)', async function() {

        // given
        const deployResourcesSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            deployResources: deployResourcesSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            clientId: 'clientId',
            clientSecret: 'clientSecret'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            },
            {
              path: 'bar.dmn',
              type: 'dmn'
            }
          ],
          tenantId: 'baz'
        });

        const { args } = deployResourcesSpy.getCall(0);

        // then
        expect(args[0][0].tenantId).not.to.exist;
        expect(args[0][1].tenantId).not.to.exist;
        expect(args[1]).to.eql('baz');
      });

    });

  });


  describe('#getGatewayVersion', function() {

    it('should set success=true if topology was retrieved', async function() {

      // given
      const topologyResponse = { clusterSize: 3, gatewayVersion: '0.26.0' };

      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          getTopology: function() {
            return topologyResponse;
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          getTopology: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).to.be.undefined;
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('TEST ERROR.', 14);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('TEST ERROR.', 13);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <unauthorized> - Cloud', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Unauthorized');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Forbidden');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Unsupported protocol');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <unknown>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError('Some random error');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for no message', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            getTopology: function() {
              throw new NetworkError();
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });

    });

  });


  describe('create client', function() {

    it('should create client with correct url', async function() {

      // given
      let usedConfig;

      const zeebeAPI = createZeebeAPI({
        configSpy(config) {
          usedConfig = config;
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig.ZEEBE_REST_ADDRESS).to.eql(TEST_URL);
    });


    it('should not create a client for unknown endpoint type', async function() {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        configSpy: createSpy
      });

      const parameters = {
        endpoint: {
          type: 'foo'
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.not.have.been.called;
    });


    it('should reuse client instance if config is same', async function() {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        configSpy: createSpy
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.have.been.called;
    });


    it('should create new client instance if config is different', async function() {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        configSpy: createSpy
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          authType: AUTH_TYPES.OAUTH,
          url: TEST_URL
        }
      });

      // then
      expect(createSpy).to.have.been.called;
    });


    it('should close client instance when creating new one', async function() {

      // given
      const closeSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        Camunda8Mock:{
          closeAllClients: closeSpy
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          authType: AUTH_TYPES.OAUTH,
          url: TEST_URL
        }
      });

      // then
      expect(closeSpy).to.have.been.called;
    });





    it('should set `CAMUNDA_SECURE_CONNECTION` to false for http:// endpoint (no auth)', async function() {

      // given
      let usedConfig;

      const zeebeAPI = createZeebeAPI({
        configSpy(config) {
          usedConfig = config;
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'http://test'
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', false);
    });



    it('should set `CAMUNDA_SECURE_CONNECTION` to true for no protocol endpoint (cloud)', async function() {

      // given
      let usedConfig;

      const zeebeAPI = createZeebeAPI({
        configSpy(config) {
          usedConfig = config;
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          url: 'camunda.com'
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', true);
    });


    it('should accept port', async function() {

      // given
      let usedConfig;

      const zeebeAPI = createZeebeAPI({
        configSpy(config) {
          usedConfig = config;
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'http://camunda.com:1337'
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).not.to.have.property('port');
    });




    describe('custom certificate', function() {

      function setup(certificate) {
        const configSpy = sinon.spy();

        const log = {
          error: sinon.spy(),
          warn: sinon.spy()
        };

        const zeebeAPI = createZeebeAPI({
          configSpy,
          flags: {
            get() {
              return '/path/to/cert.pem';
            }
          },
          fs: {
            readFile() {
              return { contents: certificate };
            }
          },
          log
        });

        return {
          configSpy,
          log,
          zeebeAPI
        };
      }

      function readFile(filePath) {
        return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
      }


      it('should pass root certificate from flag', async function() {

        // given
        const cert = readFile('./root-self-signed.pem');

        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'grpcs://camunda.com'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_CUSTOM_ROOT_CERT_STRING).to.exist;
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should pass root certificate in oauth config too', async function() {

        // given
        const cert = readFile('./root-self-signed.pem');

        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_AUTH_STRATEGY, CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_AUTH_STRATEGY).to.equal('OAUTH');
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should pass certificate to Zeebe even if appears non-root', async function() {

        // given
        const cert = 'invalid';

        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_CUSTOM_ROOT_CERT_STRING).to.exist;
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should pass certificate to zeebe even if appears invalid', async function() {

        // given
        const cert = readFile('./not-root.pem');

        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_CUSTOM_ROOT_CERT_STRING).to.exist;
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });

      it('should log warning when non-root certificate is passed via flag', async function() {

        // given
        const {
          log,
          zeebeAPI
        } = setup(readFile('./not-root.pem'));

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        expect(log.warn).to.have.been.calledWithMatch('Custom SSL certificate appears to be not a root certificate');
      });


      it('should log warn when invalid certificate is passed via flag', async function() {

        // given
        const {
          log,
          zeebeAPI
        } = setup('invalid');

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        expect(log.warn).to.have.been.called;
        expect(log.warn.args[0][0].startsWith('Failed to parse custom SSL certificate')).to.be.true;
      });

    });

  });


  describe('log', function() {

    it('should not log secrets (basic auth)', async function() {

      // given
      const logSpy = sinon.spy();

      const log = {
        debug: logSpy,
        error: logSpy,
        info: logSpy,
        warn: logSpy
      };

      const zeebeAPI = createZeebeAPI({ log });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          basicAuthUsername: 'username',
          basicAuthPassword: 'password',
          url: TEST_URL
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(logSpy).to.have.been.called;

      const createClientCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'creating client');

      expect(createClientCall).to.exist;

      expect(createClientCall.args[ 1 ]).to.eql({
        url: TEST_URL,
        options:{
          ZEEBE_REST_ADDRESS: TEST_URL,
          CAMUNDA_AUTH_STRATEGY: 'BASIC',
          CAMUNDA_BASIC_AUTH_USERNAME: 'username',
          CAMUNDA_BASIC_AUTH_PASSWORD: '******',
          CAMUNDA_SECURE_CONNECTION: true,
          port: '443'
        }
      });

      const deployCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'deploy');

      expect(deployCall).to.exist;

      expect(deployCall.args[1]).to.eql({
        parameters: {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            basicAuthUsername: 'username',
            basicAuthPassword: '******',
            url: TEST_URL
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        }
      });
    });


    it('should not log secrets (oauth)', async function() {

      // given
      const logSpy = sinon.spy();

      const log = {
        debug: logSpy,
        error: logSpy,
        info: logSpy,
        warn: logSpy
      };

      const zeebeAPI = createZeebeAPI({ log });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: TEST_URL,
          oauthURL: 'oauthURL',
          audience: 'audience',
          scope: 'scope',
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        },
        resourceConfigs: [
          {
            path: 'foo.bpmn',
            type: 'bpmn'
          }
        ]
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(logSpy).to.have.been.called;

      const createClientCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'creating client');

      expect(createClientCall).to.exist;

      expect(createClientCall.args[ 1 ]).to.eql({
        url: TEST_URL,
        options:{
          ZEEBE_REST_ADDRESS: TEST_URL,
          CAMUNDA_AUTH_STRATEGY: 'OAUTH',
          CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
          CAMUNDA_TOKEN_SCOPE: 'scope',
          ZEEBE_CLIENT_ID: 'clientId',
          ZEEBE_CLIENT_SECRET: '******',
          CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'audience',
          CAMUNDA_OAUTH_URL: 'oauthURL',
          CAMUNDA_SECURE_CONNECTION: true,
          port: '443',
        }
      });

      const deployCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'deploy');

      expect(deployCall).to.exist;

      expect(deployCall.args[ 1 ]).to.eql({
        parameters: {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            audience: 'audience',
            scope: 'scope',
            clientId: 'clientId',
            clientSecret: '******'
          },
          resourceConfigs: [
            {
              path: 'foo.bpmn',
              type: 'bpmn'
            }
          ]
        }
      });
    });

  });

});


// helpers //////////////////////
function createZeebeAPI(options = {}) {
  const fs = options.fs || {
    readFile: (_, { encoding = 'utf8' } = {}) => {
      if (encoding === false) {
        return {
          contents: Buffer.from('contents')
        };
      }

      return {
        contents: 'contents'
      };
    }
  };

  const flags = options.flags || {
    get: () => {}
  };

  const log = {
    error() {},
    debug() {},
    warn() {},
    info() {},
    ...(options.log || {})
  };

  class Camunda8Mock {
    constructor(config) {
      options.configSpy && options.configSpy(config);
      Object.assign(this, options.Camunda8Mock);
    }

    getCamundaRestClient() {
      return Object.assign({
        getTopology: () => ({ gatewayVersion: '8.7.0' }),
        deployResources: () => ({ deployments: [] }),
        createProcessInstance: noop
      }, options.CamundaRestClient);
    }

    closeAllClients = noop;

  }

  return new ZeebeAPI(fs, Camunda8Mock, flags, log);
}

function noop() {}

class NetworkError extends Error {
  constructor(message, code) {
    super(message);

    this.code = code;
  }
}
