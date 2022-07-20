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

const ZeebeAPI = require('../../lib/zeebe-api');


describe('ZeebeAPI', function() {


  // TODO(barmac): remove when system keychain certificates are tested
  setupPlatformStub();


  describe('#checkConnection', function() {

    it('should set success=true for correct check', async () => {

      // given
      const zeebeAPI = mockZeebeNode();

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async () => {

      // given
      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            topology: function() {
              throw new Error('TEST ERROR.');
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.false;
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 14);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 14);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 13);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <not-found>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <not-found> (OAuth)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <not-found> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });


      it('for <unauthorized>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unauthorized');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNAUTHORIZED');
      });


      it('for <unauthorized> - Cloud', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unauthorized');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Forbidden');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unsupported protocol');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <unknown>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Some random error');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for no message', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError();
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for <Method not found>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Method not found', 12);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        // then
        expect(result.reason).to.eql('UNSUPPORTED_ENGINE');

      });

    });

  });


  describe('#run', function() {

    it('should set success=true for successful instance run', async () => {

      // given
      const zeebeAPI = mockZeebeNode();

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      const result = await zeebeAPI.run(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async () => {

      // given
      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            createWorkflowInstance: function() {
              throw new Error('TEST ERROR.');
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      const result = await zeebeAPI.run(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.false;
      expect(result.response).to.exist;
      expect(result.response.message).to.be.eql('TEST ERROR.');
    });


    it('should return serialized error', async function() {

      // given
      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            createWorkflowInstance: function() {
              throw new Error('TEST ERROR.');
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      const result = await zeebeAPI.run(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).not.to.be.instanceOf(Error);
    });

  });


  describe('#deploy', function() {

    it('should set success=true for successful deployment', async () => {

      // given
      const zeebeAPI = mockZeebeNode();

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      const result = await zeebeAPI.deploy(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });


    it('should set success=false for failure', async () => {

      // given
      const error = new Error('test');

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: function() {
              throw error;
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
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

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: function() {
              throw error;
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      const result = await zeebeAPI.deploy(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).not.to.be.instanceOf(Error);
    });


    it('should read file as buffer', async () => {

      // given
      const fs = {
        readFile: sinon.spy(() => ({}))
      };

      const zeebeAPI = mockZeebeNode({ fs });

      const parameters = {
        filePath: 'filePath',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(fs.readFile).to.have.been.calledOnce;
      expect(fs.readFile.args).to.eql([
        [ parameters.filePath, { encoding: false } ]
      ]);
    });


    it('should suffix deployment name with .bpmn if necessary', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: 'filePath',
        name: 'not_suffixed',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('not_suffixed.bpmn');
    });


    it('should suffix deployment name with .dmn if necessary', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: 'filePath',
        name: 'not_suffixed',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        },
        diagramType: 'dmn'
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('not_suffixed.dmn');
    });


    it('should not suffix deployment name with .bpmn if not necessary', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: 'filePath',
        name: 'suffixed.bpmn',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('suffixed.bpmn');
    });


    it('should not suffix deployment name with .dmn if not necessary', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: 'filePath',
        name: 'suffixed.dmn',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        },
        diagramType: 'dmn'
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('suffixed.dmn');
    });


    it('should use file path if deployment name is empty', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: '/Users/Test/Stuff/Zeebe/process.bpmn',
        name: '',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('process.bpmn');
    });


    it('should add bpmn suffix to filename if extension is other than bpmn', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
        name: '',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('xmlFile.bpmn');
    });


    it('should add dmn suffix if extension is other than dmn and diagramType=dmn', async () => {

      // given
      const deployWorkflowSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: deployWorkflowSpy,
          };
        }
      });

      // when
      await zeebeAPI.deploy({
        filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
        name: '',
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        },
        diagramType: 'dmn'
      });

      const { args } = deployWorkflowSpy.getCall(0);

      // then
      expect(args[0].name).to.eql('xmlFile.dmn');
    });

  });


  describe('#getGatewayVersion', function() {

    it('should set success=true if topology was retrieved', async () => {

      // given
      const topologyResponse = { clusterSize: 3, gatewayVersion: '0.26.0' };

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            topology: function() {
              return topologyResponse;
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should return gatewayVersion if topology was retrieved', async () => {

      // given
      const topologyResponse = { clusterSize: 3, gatewayVersion: '0.26.0' };

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            topology: function() {
              return topologyResponse;
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.true;
      expect(result.response.gatewayVersion).to.equal(topologyResponse.gatewayVersion);
    });


    it('should set success=false on failure', async () => {

      // given
      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            topology: function() {
              throw new Error('TEST ERROR.');
            }
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.response).to.be.undefined;
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 14);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 14);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('TEST ERROR.', 13);
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <not-found>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <not-found> (OAuth)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <not-found> (Cloud)', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('ENOTFOUND');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });


      it('for <unauthorized>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unauthorized');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'selfHosted'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('UNAUTHORIZED');
      });


      it('for <unauthorized> - Cloud', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unauthorized');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Forbidden');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'camundaCloud'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Unsupported protocol');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <unknown>', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError('Some random error');
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for no message', async () => {

        // given
        const zeebeAPI = mockZeebeNode({
          ZBClient: function() {
            return {
              topology: function() {
                throw new NetworkError();
              }
            };
          }
        });

        const parameters = {
          endpoint: {
            type: 'oauth'
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });

    });

  });


  describe('create client', () => {

    it('should create client with correct url', async () => {

      // given
      let usedConfig;

      const zeebeAPI = mockZeebeNode({
        ZBClient: function(...args) {
          usedConfig = args;

          return {
            deployWorkflow: noop
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig[0]).to.eql('https://camunda.com');
    });


    it('should not create a client for unknown endpoint type', async () => {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: createSpy
      });

      const parameters = {
        endpoint: {
          type: 'foo'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.not.have.been.called;
    });


    it('should reuse the client instance if config is the same', async () => {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: createSpy
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.have.been.calledOnce;
    });


    it('should create new client instance if config is different', async () => {

      // given
      const createSpy = sinon.stub().returns({
        deployWorkflow: noop,
        close: noop
      });

      const zeebeAPI = mockZeebeNode({
        ZBClient: createSpy
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: 'oauth',
          url: 'testURL'
        }
      });

      // then
      expect(createSpy).to.have.been.calledTwice;
    });


    it('should close client instance when creating new one', async () => {

      // given
      const closeSpy = sinon.spy();

      const zeebeAPI = mockZeebeNode({
        ZBClient: function() {
          return {
            deployWorkflow: noop,
            close: closeSpy
          };
        }
      });
      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'testURL'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: 'oauth',
          url: 'testURL'
        }
      });

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });


    it('should pass root certificate from flag', async () => {

      // given
      let usedConfig;

      const zeebeAPI = mockZeebeNode({
        flags: {
          get() {
            return '/path/to/cert.pem';
          }
        },
        fs: {
          readFile() {
            return { contents: 'CERTIFICATE' };
          }
        },
        ZBClient: function(...args) {
          usedConfig = args;

          return {
            deployWorkflow: noop
          };
        }
      });

      const parameters = {
        endpoint: {
          type: 'selfHosted',
          url: 'https://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      const { customSSL } = usedConfig[1];
      expect(customSSL).to.exist;

      const { rootCerts } = customSSL;
      console.log(rootCerts.toString('utf8'));
      expect(Buffer.from('CERTIFICATE').equals(rootCerts)).to.be.true;
    });
  });

});


// helpers //////////////////////
function setupPlatformStub() {
  let platformStub;

  before(() => {
    platformStub = sinon.stub(process, 'platform').value('CI');
  });

  after(() => {
    platformStub.restore();
  });
}

function mockZeebeNode(options = {}) {
  const fs = options.fs || {
    readFile: () => ({})
  };
  const flags = options.flags || {
    get: () => {}
  };

  const ZeebeNode = {
    ZBClient: options.ZBClient || function() {
      return {
        topology: noop,
        deployWorkflow: noop,
        createWorkflowInstance: noop,
        close: noop
      };
    }
  };

  return new ZeebeAPI(fs, ZeebeNode, flags);
}

function noop() {}

class NetworkError extends Error {
  constructor(message, code) {
    super(message);

    this.code = code;
  }
}
