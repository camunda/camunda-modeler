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

const C8ctl = require('../../lib/c8ctl');

const { createZeebeRouter } = C8ctl;


describe('C8ctl', function() {

  describe('targets', function() {

    it('should map a self-managed endpoint with basic auth', async function() {

      // given
      const api = createApi();
      const c8ctl = createC8ctl(api);

      // when
      await c8ctl.getGatewayVersion({
        endpoint: {
          type: 'selfHosted',
          authType: 'basic',
          url: 'http://localhost:8080/v2',
          basicAuthUsername: 'demo',
          basicAuthPassword: 'demo'
        }
      });

      // then
      expect(api.getTopology.firstCall.args[0].target).to.eql({
        cluster: {
          baseUrl: 'http://localhost:8080/v2',
          authStrategy: 'BASIC',
          username: 'demo',
          password: 'demo'
        }
      });
    });


    it('should map a SaaS endpoint to OAuth with the Camunda login', async function() {

      // given
      const api = createApi();
      const c8ctl = createC8ctl(api);

      // when
      await c8ctl.getGatewayVersion({
        endpoint: {
          type: 'camundaCloud',
          url: 'https://bru-2.zeebe.camunda.io/cluster-id',
          clientId: 'client',
          clientSecret: 'secret',
          audience: 'zeebe.camunda.io'
        }
      });

      // then
      expect(api.getTopology.firstCall.args[0].target.cluster).to.include({
        authStrategy: 'OAUTH',
        oAuthUrl: 'https://login.cloud.camunda.io/oauth/token',
        clientId: 'client',
        clientSecret: 'secret'
      });
    });

  });


  describe('results', function() {

    it('should return deployments in the shape the renderer reads', async function() {

      // given
      const api = createApi({
        deploy: async () => ({
          deploymentKey: '1',
          tenantId: '<default>',
          resources: [
            { type: 'process', id: 'Process_2', version: 2, key: '10', resourceName: 'diagram.bpmn' },
            { type: 'resource', file: { name: 'diagram.bpmn' } }
          ]
        })
      });
      const c8ctl = createC8ctl(api);

      // when
      const result = await c8ctl.deploy({
        endpoint: SELF_MANAGED,
        resourceConfigs: [ { path: '/diagram.bpmn' } ]
      });

      // then
      expect(result.success).to.be.true;
      expect(result.response.deployments).to.have.length(1);
      expect(result.response.deployments[0].process).to.include({
        bpmnProcessId: 'Process_2',
        version: 2,
        processDefinitionKey: '10',
        resourceName: 'diagram.bpmn'
      });
    });


    it('should start an instance of the exact definition', async function() {

      // given
      const api = createApi();
      const c8ctl = createC8ctl(api);

      // when
      await c8ctl.startInstance({
        endpoint: SELF_MANAGED,
        processId: 'Process_1',
        processDefinitionKey: '10',
        startInstructions: [ { elementId: 'Task_1' } ]
      });

      // then
      const input = api.createProcessInstance.firstCall.args[0];

      expect(input).to.include({ processDefinitionKey: '10' });
      expect(input).not.to.have.property('processDefinitionId');
      expect(input.startInstructions).to.eql([ { elementId: 'Task_1' } ]);
    });

  });


  describe('errors', function() {

    function failingWith(code, problem) {
      return createApi({
        getTopology: async () => {
          throw createC8ctlError(code, problem);
        }
      });
    }

    for (const [ code, endpoint, reason, problem ] of [
      [ 'connection-failed', SELF_MANAGED_ENDPOINT(), 'CONTACT_POINT_UNAVAILABLE' ],
      [ 'connection-failed', SAAS_ENDPOINT(), 'CLUSTER_UNAVAILABLE' ],
      [ 'unauthorized', SELF_MANAGED_ENDPOINT(), 'UNAUTHORIZED' ],
      [ 'unauthorized', SAAS_ENDPOINT(), 'INVALID_CREDENTIALS' ],
      [ 'forbidden', SELF_MANAGED_ENDPOINT(), 'FORBIDDEN' ],
      [ 'request-rejected', SELF_MANAGED_ENDPOINT(), 'CLUSTER_TEMPORARILY_UNAVAILABLE', { status: 503 } ],
      [ 'unknown', SELF_MANAGED_ENDPOINT(), 'UNKNOWN' ]
    ]) {

      it(`should report <${ code }> on ${ endpoint.type } as ${ reason }`, async function() {

        // given
        const c8ctl = createC8ctl(failingWith(code, problem));

        // when
        const result = await c8ctl.getGatewayVersion({ endpoint });

        // then
        expect(result).to.eql({ success: false, reason });
      });
    }


    it('should rethrow errors that are not c8ctl errors', async function() {

      // given
      const c8ctl = createC8ctl(createApi({
        getTopology: async () => {
          throw new Error('bug');
        }
      }));

      // when
      const error = await c8ctl.getGatewayVersion({ endpoint: SELF_MANAGED }).catch(error => error);

      // then
      expect(error.message).to.eql('bug');
    });

  });

});


describe('createZeebeRouter', function() {

  function createRouter({ rest }) {
    const c8ctl = {
      canServe: (endpoint) => !/^grpc/.test(endpoint.url),
      getGatewayVersion: sinon.stub().resolves('c8ctl'),
      deploy: sinon.stub().resolves('c8ctl'),
      searchVariables: sinon.stub().resolves('c8ctl')
    };

    const zeebeAPI = {
      usesRest: sinon.stub().resolves(rest),
      deploy: sinon.stub().resolves('zeebe-api')
    };

    return createZeebeRouter(c8ctl, zeebeAPI);
  }


  it('should call c8ctl for an endpoint that resolves to REST', async function() {

    // given
    const route = createRouter({ rest: true });

    // when
    const result = await route('deploy', { endpoint: SELF_MANAGED });

    // then
    expect(result).to.eql('c8ctl');
  });


  it('should call zeebe-api for a gRPC endpoint', async function() {

    // given
    const route = createRouter({ rest: false });

    // when
    const result = await route('deploy', { endpoint: { ...SELF_MANAGED, url: 'http://localhost:26500' } });

    // then
    expect(result).to.eql('zeebe-api');
  });


  it('should check a connection through the gateway version', async function() {

    // given
    const route = createRouter({ rest: true });

    // when
    const result = await route('checkConnection', { endpoint: SELF_MANAGED });

    // then
    expect(result).to.eql('c8ctl');
  });


  it('should fail a REST-only call for a gRPC endpoint', async function() {

    // given
    const route = createRouter({ rest: false });

    // when
    const result = await route('searchVariables', { endpoint: { ...SELF_MANAGED, url: 'grpc://localhost:26500' } });

    // then
    expect(result).to.eql({ success: false, reason: 'UNKNOWN' });
  });

});


// helpers //////////

const SELF_MANAGED = SELF_MANAGED_ENDPOINT();

function SELF_MANAGED_ENDPOINT() {
  return { type: 'selfHosted', authType: 'none', url: 'http://localhost:8080/v2' };
}

function SAAS_ENDPOINT() {
  return {
    type: 'camundaCloud',
    url: 'https://bru-2.zeebe.camunda.io/cluster-id',
    clientId: 'client',
    clientSecret: 'secret'
  };
}

function createC8ctl(api) {
  return new C8ctl({
    modelerDir: '/tmp',
    fetch: () => {},
    loadApi: () => api
  });
}

function createApi(overrides = {}) {
  return {
    isC8ctlError: (error) => !!error && error.isC8ctlError === true,
    getTopology: sinon.stub().resolves({ gatewayVersion: '8.10.0' }),
    createProcessInstance: sinon.stub().resolves({ processInstanceKey: '20' }),
    deploy: sinon.stub().resolves({ deploymentKey: '1', resources: [] }),
    ...wrapStubs(overrides)
  };
}

function wrapStubs(overrides) {
  return Object.fromEntries(
    Object.entries(overrides).map(([ name, fn ]) => [ name, sinon.spy(fn) ])
  );
}

function createC8ctlError(code, problem) {
  return {
    isC8ctlError: true,
    code,
    message: code,
    ...(problem ? { problem } : {}),
    toJSON() {
      return { code };
    }
  };
}
