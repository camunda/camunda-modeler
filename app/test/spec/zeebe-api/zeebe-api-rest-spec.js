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

const { setupSystemCertificatesStub } = require('./helper');


describe('ZeebeAPI (REST)', function() {


  // TODO(barmac): remove when system certificates are tested
  setupSystemCertificatesStub();


  describe('#listSecrets', function() {

    it('should set success=false when the REST client is not available', async function() {

      // given
      const zeebeAPI = createZeebeAPI();

      sinon.stub(zeebeAPI._camundaClients, 'getSupportedCamundaClients').resolves({});

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.listSecrets(parameters);

      // then
      expect(result.success).to.be.false;
    });


    it('should set success=true on success', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          callApiEndpoint: () => ({ references: [] })
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.listSecrets(parameters);

      // then
      expect(result.success).to.be.true;
      expect(result.response).to.exist;
    });


    it('should set success=false on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          callApiEndpoint: () => { throw new Error('TEST ERROR.'); }
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      const result = await zeebeAPI.listSecrets(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.exist;
    });


    it('should return the response status on failure', async function() {

      // given
      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          callApiEndpoint: () => {
            const error = new Error('TEST ERROR.');

            error.statusCode = 403;

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
      const result = await zeebeAPI.listSecrets(parameters);

      // then
      expect(result.success).to.be.false;
      expect(result.status).to.equal(403);
    });


    it('should list secrets with an empty body', async function() {

      // given
      const callApiEndpointSpy = sinon.spy(() => ({ references: [] }));

      const zeebeAPI = createZeebeAPI({
        CamundaRestClient: {
          callApiEndpoint: callApiEndpointSpy
        }
      });

      const parameters = {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          url: TEST_URL
        }
      };

      // when
      await zeebeAPI.listSecrets(parameters);

      // then
      expect(callApiEndpointSpy).to.have.been.calledWithMatch({
        method: 'POST',
        urlPath: 'secrets/list',
        body: {}
      });
    });


    describe('should return correct error reason on failure', function() {

      it('for <endpoint-unavailable> (Cloud) - error 14', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <endpoint-unavailable> (Cloud) - error 13', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <connection-refused> (Self-Managed)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
              throw new NetworkError('connect ECONNREFUSED 127.0.0.1:8080', 'ECONNREFUSED');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'http://localhost:8080'
          }
        };

        // when
        const result = await zeebeAPI.listSecrets(parameters);

        // then
        expect(result.reason).to.eql('CONTACT_POINT_UNAVAILABLE');
      });


      it('for <connection-refused> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
              throw new NetworkError('connect ECONNREFUSED 127.0.0.1:8080', 'ECONNREFUSED');
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
        const result = await zeebeAPI.listSecrets(parameters);

        // then
        expect(result.reason).to.eql('CLUSTER_UNAVAILABLE');
      });


      it('for <service-unavailable> (Cloud), e.g. paused cluster', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
              throw new HttpError(503, 'Service Unavailable');
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
        const result = await zeebeAPI.listSecrets(parameters);

        // then
        expect(result.reason).to.eql('CLUSTER_TEMPORARILY_UNAVAILABLE');
      });


      it('for <bad-gateway> (Self-Managed)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
              throw new HttpError(502, 'Bad Gateway');
            }
          }
        });

        const parameters = {
          endpoint: {
            type: ENDPOINT_TYPES.SELF_HOSTED,
            url: 'http://localhost:8080'
          }
        };

        // when
        const result = await zeebeAPI.listSecrets(parameters);

        // then
        expect(result.reason).to.eql('CLUSTER_TEMPORARILY_UNAVAILABLE');
      });


      it('for <not-found> (Cloud)', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('INVALID_CLIENT_ID');
      });




      it('for <unauthorized> - Cloud', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('INVALID_CREDENTIALS');
      });


      it('for <forbidden>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('FORBIDDEN');
      });


      it('for <unsupported-protocol>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('OAUTH_URL');
      });


      it('for <unknown>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for no message', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        expect(result.reason).to.eql('UNKNOWN');
      });


      it('for <Method not found>', async function() {

        // given
        const zeebeAPI = createZeebeAPI({
          CamundaRestClient: {
            callApiEndpoint: function() {
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
        const result = await zeebeAPI.listSecrets(parameters);

        // then
        expect(result.reason).to.eql('UNSUPPORTED_ENGINE');

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

// mirrors the shape of got's HTTPError thrown by the Camunda REST client
class HttpError extends Error {
  constructor(statusCode, statusMessage) {
    super(`Response code ${statusCode} (${statusMessage})`);

    this.response = { statusCode };
  }
}
