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

import ZeebeAPI from '../ZeebeAPI';

import {
  AUTH_TYPES,
  TARGET_TYPES
} from '../ZeebeAPI';


describe('<ZeebeAPI>', function() {

  describe('#checkConnection', function() {

    it('should check connection (self-managed, no auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        }
      });
    });


    it('should check connection (self-managed, no auth, add protocol)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'localhost:26500'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: `http://${ endpoint.contactPoint }`,
          tenantId: undefined
        }
      });
    });


    it('should check connection (self-managed, basic auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'http://localhost:26500';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        contactPoint,
        basicAuthUsername: 'username',
        basicAuthPassword: 'password'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          url: contactPoint,
          basicAuthUsername: 'username',
          basicAuthPassword: 'password',
          tenantId: undefined
        }
      });
    });


    it('should check connection (self-managed, oauth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: 'baz',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: endpoint.scope,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          tenantId: undefined
        }
      });
    });


    it('should check connection (self-managed, oauth, remove scope)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: '',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: undefined,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          tenantId: undefined
        }
      });
    });


    it('should check connection (SaaS)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
        camundaCloudClientId: 'foo',
        camundaCloudClientSecret: 'bar',
        camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.CAMUNDA_CLOUD,
          url: endpoint.camundaCloudClusterUrl,
          clientId: endpoint.camundaCloudClientId,
          clientSecret: endpoint.camundaCloudClientSecret
        }
      });
    });

  });


  describe('#startInstance', function() {

    it('should start instance (self-managed, no auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };

      const variables = {
        foo: 'bar'
      };

      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.NONE,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });


    it('should start instance (self-managed, no auth, add protocol)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'localhost:26500'
      };

      const variables = {
        foo: 'bar'
      };

      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.NONE,
          type: TARGET_TYPES.SELF_HOSTED,
          url: `http://${ endpoint.contactPoint }`,
          tenantId: undefined
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });


    it('should start instance (self-managed, basic auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        contactPoint: 'http://localhost:26500',
        basicAuthUsername: 'username',
        basicAuthPassword: 'password'
      };

      const variables = {
        foo: 'bar'
      };

      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.BASIC,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          basicAuthUsername: endpoint.basicAuthUsername,
          basicAuthPassword: endpoint.basicAuthPassword,
          tenantId: undefined
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });


    it('should start instance (self-managed, basic auth, with tenant)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const tenantId = 'my-tenant';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        contactPoint: 'http://localhost:26500',
        basicAuthUsername: 'username',
        basicAuthPassword: 'password',
        tenantId
      };

      const variables = {
        foo: 'bar'
      };



      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.BASIC,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          basicAuthUsername: endpoint.basicAuthUsername,
          basicAuthPassword: endpoint.basicAuthPassword,
          tenantId: 'my-tenant'
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });


    it('should start instance (self-managed, oauth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: 'baz',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      const variables = {
        foo: 'bar'
      };

      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.OAUTH,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: endpoint.scope,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          tenantId: undefined
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });


    it('should start instance (self-managed, oauth, remove scope)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const processId = 'Process_1';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: '',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      const variables = {
        foo: 'bar'
      };

      // when
      zeebeAPI.startInstance({
        processId,
        endpoint,
        variables
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:startInstance', {
        processDefinitionKey: undefined,
        processId,
        endpoint: {
          authType: AUTH_TYPES.OAUTH,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: undefined,
          tenantId: undefined,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret
        },
        variables,
        startInstructions: undefined,
        runtimeInstructions: undefined
      });
    });

  });


  describe('#deploy', function() {

    it('should deploy (self-managed, no auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];

      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.NONE,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        resourceConfigs
      });
    });


    it('should deploy (self-managed, no auth, add protocol)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'localhost:26500'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];

      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.NONE,
          type: TARGET_TYPES.SELF_HOSTED,
          url: `http://${ endpoint.contactPoint }`,
          tenantId: undefined
        },
        resourceConfigs
      });
    });


    it('should deploy (self-managed, basic auth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        contactPoint: 'http://localhost:26500',
        basicAuthUsername: 'username',
        basicAuthPassword: 'password'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];

      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.BASIC,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          basicAuthUsername: endpoint.basicAuthUsername,
          basicAuthPassword: endpoint.basicAuthPassword,
          tenantId: undefined
        },
        resourceConfigs
      });
    });


    it('should deploy (self-managed, basic auth, with tenant)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);


      const tenantId = 'my-tenant';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        contactPoint: 'http://localhost:26500',
        basicAuthUsername: 'username',
        basicAuthPassword: 'password',
        tenantId
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];


      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.BASIC,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          basicAuthUsername: endpoint.basicAuthUsername,
          basicAuthPassword: endpoint.basicAuthPassword,
          tenantId: 'my-tenant'
        },
        resourceConfigs
      });
    });


    it('should start instance (self-managed, oauth)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: 'baz',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];

      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.OAUTH,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: endpoint.scope,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          tenantId: undefined
        },
        resourceConfigs
      });
    });


    it('should deploy (self-managed, oauth, with tenant)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const tenantId = 'my-tenant';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: 'baz',
        tenantId,
        clientId: 'foo',
        clientSecret: 'bar'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];



      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.OAUTH,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: endpoint.scope,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          tenantId: 'my-tenant'
        },
        resourceConfigs
      });
    });


    it('should deploy (self-managed, no auth, tenant passed)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);


      const tenantId = 'my-tenant';

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500',
        tenantId
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];


      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.NONE,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          tenantId: 'my-tenant'
        },
        resourceConfigs
      });
    });


    it('should start instance (self-managed, oauth, remove scope)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: 'http://localhost:26500',
        oauthURL: 'foo.com',
        audience: 'bar.com',
        scope: '',
        clientId: 'foo',
        clientSecret: 'bar'
      };

      const resourceConfigs = [
        {
          path: '/path/to/file.bpmn',
          type: 'bpmn'
        }
      ];

      // when
      zeebeAPI.deploy({
        endpoint,
        resourceConfigs
      });

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:deploy', {
        endpoint: {
          authType: AUTH_TYPES.OAUTH,
          type: TARGET_TYPES.SELF_HOSTED,
          url: endpoint.contactPoint,
          oauthURL: endpoint.oauthURL,
          audience: endpoint.audience,
          scope: undefined,
          tenantId: undefined,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret
        },
        resourceConfigs
      });
    });

  });


  describe('#getGatewayVersion', function() {

    it('should get gateway version', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };

      // when
      zeebeAPI.getGatewayVersion(endpoint);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:getGatewayVersion', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        }
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
  send() {
    return Promise.resolve();
  }
}
