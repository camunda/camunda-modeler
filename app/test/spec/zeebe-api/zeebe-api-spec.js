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

const TEST_URL = 'http://localhost:26500';

const {
  AUTH_TYPES,
  ENDPOINT_TYPES
} = require('../../../lib/zeebe-api/constants');


describe('ZeebeAPI', function() {


  // TODO(barmac): remove when system keychain certificates are tested
  setupPlatformStub();


  describe('#checkConnection', function() {

    it('should set success=true for correct check', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
          topology: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.checkConnection(parameters);

      // then
      expect(result.success).to.be.false;
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 14);
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
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 14', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 14);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 13);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (self-managed) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Error: 13 INTERNAL:');
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
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (self-managed) - error 14', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Error: 14 UNAVAILABLE:');
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
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <not-found>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
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
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <not-found> (OAuth)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <not-found> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });


      it('for <unauthorized>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unauthorized');
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
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('UNAUTHORIZED');
      });


      it('for <unauthorized> - Cloud', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unauthorized');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Forbidden');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unsupported protocol');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
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
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Some random error');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.OAUTH,
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
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError();
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.OAUTH,
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
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Method not found', 12);
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
        const result = await zeebeAPI.checkConnection(parameters);

        // then
        expect(result.reason).to.eql('UNSUPPORTED_ENGINE');

      });

    });

  });


  describe('#run', function() {

    it('should set success=true for successful instance run', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.run(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
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
      const result = await zeebeAPI.run(parameters);

      // then
      expect(result).to.exist;
      expect(result.success).to.be.false;
      expect(result.response).to.exist;
      expect(result.response.message).to.be.eql('TEST ERROR.');
    });


    it('should return serialized error', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
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
      const result = await zeebeAPI.run(parameters);

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
        }
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
        ZeebeGrpcApiClient: {
          deployResource: function() {
            throw error;
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
        ZeebeGrpcApiClient: {
          deployResource: function() {
            throw error;
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
        filePath: 'filePath',
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
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


    describe('resource types', function() {

      it('should deploy BPMN', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          },
          fs: {
            readFile() {
              return { contents: '</>' };
            }
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'process.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].process).to.exist;
        expect(args[0].process).to.eql('</>');
      });


      it('should deploy DMN', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          },
          fs: {
            readFile() {
              return { contents: '</>' };
            }
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'decision.dmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'dmn'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].decision).to.exist;
        expect(args[0].decision).to.eql('</>');
      });


      it('should deploy form', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          },
          fs: {
            readFile() {
              return { contents: '{}' };
            }
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'form.form',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'form'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].form).to.exist;
        expect(args[0].form).to.eql('{}');
      });

    });


    describe('deployment name', function() {

      it('should suffix deployment name with .bpmn if necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'not_suffixed',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('not_suffixed.bpmn');
      });


      it('should suffix deployment name with .dmn if necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'not_suffixed',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'dmn'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('not_suffixed.dmn');
      });


      it('should suffix deployment name with .form if necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'not_suffixed',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'form'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('not_suffixed.form');
      });


      it('should not suffix deployment name with .bpmn if not necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'suffixed.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('suffixed.bpmn');
      });


      it('should not suffix deployment name with .dmn if not necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'suffixed.dmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'dmn'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('suffixed.dmn');
      });


      it('should not suffix deployment name with .form if not necessary', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'suffixed.form',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'form'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('suffixed.form');
      });


      it('should use file path if deployment name is empty', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/process.bpmn',
          name: '',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('process.bpmn');
      });


      it('should add bpmn suffix to filename if extension is other than bpmn', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
          name: '',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('xmlFile.bpmn');
      });


      it('should add bpmn extension if name ends with bpmn without extension', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
          name: 'orchestrae-location-check-bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          }
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('orchestrae-location-check-bpmn.bpmn');
      });


      it('should add dmn suffix if extension is other than dmn and resourceType=dmn', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
          name: '',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'dmn'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('xmlFile.dmn');
      });


      it('should add dmn extension if name ends with dmn without extension', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/xmlFile.xml',
          name: 'orchestrae-location-check-dmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'dmn'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('orchestrae-location-check-dmn.dmn');
      });


      it('should add form suffix if extension is other than form and resourceType=form', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/jsonFile.json',
          name: '',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'form'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('jsonFile.form');
      });


      it('should add form extension if name ends with form without extension', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy,
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: '/Users/Test/Stuff/Zeebe/jsonFile.json',
          name: 'application-form',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: TEST_URL
          },
          resourceType: 'form'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].name).to.eql('application-form.form');
      });

    });


    describe('basic auth', function() {

      it('should pass configuration', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const configSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          configSpy,
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'process.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            url: TEST_URL,
            basicAuthUsername: 'username',
            basicAuthPassword: 'password'
          }
        });

        // then
        const [ config ] = configSpy.getCall(0).args;

        // ZBClient is invoked accordingly
        expect(config.ZEEBE_GRPC_ADDRESS).to.eql('localhost:26500');

        expect(config).to.include.keys({
          ZEEBE_GRPC_ADDRESS: 'url',
          CAMUNDA_AUTH_STRATEGY: 'basic',
          CAMUNDA_BASIC_AUTH_USERNAME: 'username',
          CAMUNDA_BASIC_AUTH_PASSWORD: 'password'
        });

        // deployment is executed appropriately
        expect(deployResourceSpy).to.have.been.calledWith({ name: 'process.bpmn', process: undefined });
      });

    });


    describe('OAuth', function() {

      it('should pass configuration', async function() {

        // given
        const configSpy = sinon.spy();
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          configSpy,
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'process.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            audience: 'audience',
            scope: 'scope',
            clientId: 'clientId',
            clientSecret: 'clientSecret'
          }
        });

        // then
        const config = configSpy.getCall(0).args[0];

        // ZBClient is invoked accordingly
        expect(config.ZEEBE_GRPC_ADDRESS).to.eql('localhost:26500');

        expect(config).to.include.keys({
          CAMUNDA_AUTH_STRATEGY: 'OAUTH',
          CAMUNDA_CONSOLE_OAUTH_AUDIENCE: 'audience',
          ZEEBE_CLIENT_ID: 'clientId',
          ZEEBE_CLIENT_SECRET: 'clientSecret',
          CAMUNDA_TOKEN_SCOPE: 'scope',
          CAMUNDA_OAUTH_URL: 'oauthURL',
          CAMUNDA_TOKEN_DISK_CACHE_DISABLE: 'true'
        });

        // deployment is executed appropriately
        expect(deployResourceSpy).to.have.been.calledWith({ name: 'process.bpmn', process: undefined });
      });

    });


    describe('tenant ID', function() {

      it('should add tenant ID if exists', async function() {

        // given
        const deployResourceSpy = sinon.spy();

        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            deployResource: deployResourceSpy
          }
        });

        // when
        await zeebeAPI.deploy({
          filePath: 'filePath',
          name: 'process.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL,
            oauthURL: 'oauthURL',
            clientId: 'clientId',
            clientSecret: 'clientSecret'
          },
          tenantId: 'tenantId'
        });

        const { args } = deployResourceSpy.getCall(0);

        // then
        expect(args[0].tenantId).to.eql('tenantId');
      });

    });

  });


  describe('#getGatewayVersion', function() {

    it('should set success=true if topology was retrieved', async function() {

      // given
      const topologyResponse = { clusterSize: 3, gatewayVersion: '0.26.0' };

      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
          topology: function() {
            return topologyResponse;
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.true;
    });


    it('should return gatewayVersion if topology was retrieved', async function() {

      // given
      const topologyResponse = { clusterSize: 3, gatewayVersion: '0.26.0' };

      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
          topology: function() {
            return topologyResponse;
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: 'https://google.com'
        }
      };

      // when
      const result = await zeebeAPI.getGatewayVersion(parameters);

      // then
      expect(result.success).to.be.true;
      expect(result.response.gatewayVersion).to.equal(topologyResponse.gatewayVersion);
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
          topology: function() {
            throw new Error('TEST ERROR.');
          }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
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

      it('for <endpoint-unavailable>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 14);
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

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 14);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('TEST ERROR.', 13);
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <not-found>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
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

        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <not-found> (OAuth)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: TEST_URL
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <not-found> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('ENOTFOUND');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });


      it('for <unauthorized>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unauthorized');
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

        expect(result.reason).to.eql('UNAUTHORIZED');
      });


      it('for <unauthorized> - Cloud', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unauthorized');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.checkConnection(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Forbidden');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.CAMUNDA_CLOUD
          }
        };

        // when
        const result = await zeebeAPI.getGatewayVersion(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Unsupported protocol');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
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
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError('Some random error');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.OAUTH,
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
          ZeebeGrpcApiClient: {
            topology: function() {
              throw new NetworkError();
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.OAUTH,
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
          url: 'https://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig.ZEEBE_GRPC_ADDRESS).to.eql('camunda.com');
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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.not.have.been.called;
    });


    it('should reuse the client instance if config is the same', async function() {

      // given
      const createSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        configSpy: createSpy
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy(parameters);

      // then
      expect(createSpy).to.have.been.calledOnce;
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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: TEST_URL
        }
      });

      // then
      expect(createSpy).to.have.been.calledTwice;
    });


    it('should close client instance when creating new one', async function() {

      // given
      const closeSpy = sinon.spy();

      const zeebeAPI = createZeebeAPI({
        ZeebeGrpcApiClient: {
          close: closeSpy
        }
      });
      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      await zeebeAPI.deploy({
        ...parameters,
        endpoint: {
          type: ENDPOINT_TYPES.OAUTH,
          url: TEST_URL
        }
      });

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });


    it('should set `CAMUNDA_SECURE_CONNECTION` to true for https endpoint', async function() {

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
          url: 'https://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', true);
    });


    it('should set `CAMUNDA_SECURE_CONNECTION=false` for http endpoint (no auth)', async function() {

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
          url: 'http://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', false);
    });


    it('should set `CAMUNDA_SECURE_CONNECTION=false` for http endpoint (oauth)', async function() {

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
          authType: AUTH_TYPES.OAUTH,
          url: 'http://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', false);
    });


    it('should set `CAMUNDA_SECURE_CONNECTION=true` for no protocol endpoint (cloud)', async function() {

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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', true);
    });


    it('should have secure connection for no protocol endpoint (cloud)', async function() {

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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('CAMUNDA_SECURE_CONNECTION', true);
    });


    it('should NOT change provided port', async function() {

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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).not.to.have.property('port');
    });


    it('should infer port=80 if missing for http endpoint', async function() {

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
          url: 'http://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('port', '80');
    });


    it('should infer port=443 if missing for https endpoint', async function() {

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
          url: 'https://camunda.com'
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      expect(usedConfig).to.have.property('port', '443');
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
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_CUSTOM_ROOT_CERT_STRING).to.exist;
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should pass root certificate in oAuth config too', async function() {

        // given
        const cert = readFile('./root-self-signed.pem');
        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_AUTH_STRATEGY, CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_AUTH_STRATEGY).to.equal('OAUTH');
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should pass certificate to zeebe even if appears non-root', async function() {

        // given
        const cert = 'invalid';
        const {
          configSpy,
          zeebeAPI
        } = setup(cert);

        const parameters = {
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
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
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        const { CAMUNDA_CUSTOM_ROOT_CERT_STRING } = configSpy.getCall(0).args[0];

        expect(CAMUNDA_CUSTOM_ROOT_CERT_STRING).to.exist;
        expect(Buffer.from(cert).equals(CAMUNDA_CUSTOM_ROOT_CERT_STRING)).to.be.true;
      });


      it('should NOT log error when root certificate is passed via flag', async function() {

        // given
        const {
          log,
          zeebeAPI
        } = setup(readFile('./root-self-signed.pem'));

        const parameters = {
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        expect(log.warn).not.to.have.been.called;
        expect(log.error).not.to.have.been.called;
      });


      it('should log warning when non-root certificate is passed via flag', async function() {

        // given
        const {
          log,
          zeebeAPI
        } = setup(readFile('./not-root.pem'));

        const parameters = {
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        expect(log.warn).to.have.been.calledOnceWithExactly('Custom SSL certificate appears to be not a root certificate');
      });


      it('should log warn when invalid certificate is passed via flag', async function() {

        // given
        const {
          log,
          zeebeAPI
        } = setup('invalid');

        const parameters = {
          filePath: '/path/to/file.bpmn',
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'https://camunda.com'
          }
        };

        // when
        await zeebeAPI.deploy(parameters);

        // then
        expect(log.warn).to.have.been.calledOnce;
        expect(log.warn.args[0][0].startsWith('Failed to parse custom SSL certificate')).be.true;
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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      console.log(logSpy.getCalls().map(call => JSON.stringify(call.args), null, 2));

      expect(logSpy).to.have.been.called;

      const createClientCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'creating client');

      expect(createClientCall).to.exist;

      expect(createClientCall.args[ 1 ]).to.eql({
        url: 'http://localhost:26500',
        options:{
          zeebeGrpcSettings: {
            ZEEBE_GRPC_CLIENT_RETRY: false
          },
          ZEEBE_GRPC_ADDRESS: 'localhost:26500',
          CAMUNDA_AUTH_STRATEGY: 'BASIC',
          CAMUNDA_BASIC_AUTH_USERNAME: 'username',
          CAMUNDA_BASIC_AUTH_PASSWORD: '******',
          CAMUNDA_SECURE_CONNECTION: false
        }
      });

      const deployCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'deploy');

      expect(deployCall).to.exist;

      expect(deployCall.args[ 1 ]).to.eql({
        parameters: {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            basicAuthUsername: 'username',
            basicAuthPassword: '******',
            url: TEST_URL
          }
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
        }
      };

      // when
      await zeebeAPI.deploy(parameters);

      // then
      console.log(logSpy.getCalls().map(call => JSON.stringify(call.args), null, 2));

      expect(logSpy).to.have.been.called;

      const createClientCall = logSpy.getCalls().find(call => call.args[ 0 ] === 'creating client');

      expect(createClientCall).to.exist;

      expect(createClientCall.args[ 1 ]).to.eql({
        url: 'http://localhost:26500',
        options:{
          zeebeGrpcSettings: {
            ZEEBE_GRPC_CLIENT_RETRY: false
          },
          ZEEBE_GRPC_ADDRESS: 'localhost:26500',
          CAMUNDA_AUTH_STRATEGY: 'OAUTH',
          CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
          CAMUNDA_TOKEN_SCOPE: 'scope',
          ZEEBE_CLIENT_ID: 'clientId',
          ZEEBE_CLIENT_SECRET: '******',
          CAMUNDA_CONSOLE_OAUTH_AUDIENCE: 'audience',
          CAMUNDA_OAUTH_URL: 'oauthURL',
          CAMUNDA_SECURE_CONNECTION: false
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
          }
        }
      });
    });

  });

});


// helpers //////////////////////
function setupPlatformStub() {
  let platformStub;

  // eslint-disable-next-line mocha/no-top-level-hooks
  before(function() {
    platformStub = sinon.stub(process, 'platform').value('CI');
  });

  // eslint-disable-next-line mocha/no-top-level-hooks
  after(function() {
    platformStub.restore();
  });
}

function createZeebeAPI(options = {}) {
  const fs = options.fs || {
    readFile: () => ({})
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
    }

    getZeebeGrpcApiClient() {
      return Object.assign({
        topology: noop,
        deployResource: noop,
        createProcessInstance: noop,
        close: noop
      }, options.ZeebeGrpcApiClient);
    }
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
