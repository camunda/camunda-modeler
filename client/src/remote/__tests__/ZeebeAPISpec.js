/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

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


    it('should check connection (self-managed, no auth, with tenant id)', function() {

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

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: 'my-tenant'
        }
      });
    });


    it('should check connection (self-managed, basic auth, with tenant id)', function() {

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

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledOnce;
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          url: endpoint.contactPoint,
          basicAuthUsername: 'username',
          basicAuthPassword: 'password',
          tenantId: 'my-tenant'
        }
      });
    });


    it('should check connection (self-managed, oauth, with tenant id)', function() {

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
        clientId: 'foo',
        clientSecret: 'bar',
        tenantId
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
          tenantId: 'my-tenant'
        }
      });
    });


    it('should check connection (SaaS, with tenant id)', function() {

      // given
      const backend = new MockBackend({
        send: sinon.spy()
      });

      const zeebeAPI = new ZeebeAPI(backend);

      const endpoint = {
        targetType: TARGET_TYPES.CAMUNDA_CLOUD,
        camundaCloudClientId: 'foo',
        camundaCloudClientSecret: 'bar',
        camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443',
        tenantId: 'my-tenant'
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: TARGET_TYPES.CAMUNDA_CLOUD,
          url: endpoint.camundaCloudClusterUrl,
          clientId: endpoint.camundaCloudClientId,
          clientSecret: endpoint.camundaCloudClientSecret,
          tenantId: endpoint.tenantId
        }
      });
    });

    it('should check connection (SaaS, without tenant id)', function() {

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
          clientSecret: endpoint.camundaCloudClientSecret,
          tenantId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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
        runtimeInstructions: undefined,
        businessId: undefined
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


  describe('#searchProcessInstances', function() {

    it('should search process instances', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchProcessInstances({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchProcessInstances', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchElementInstances', function() {

    it('should search element instances', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchElementInstances({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchElementInstances', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchChildProcessInstances', function() {

    it('should search child process instances', function() {

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

      const parentProcessInstanceKey = '123';

      // when
      zeebeAPI.searchChildProcessInstances({ endpoint }, parentProcessInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchProcessInstances', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        parentProcessInstanceKey
      });

    });

  });


  describe('#searchVariables', function() {

    it('should search variables', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchVariables({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchVariables', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchIncidents', function() {

    it('should search incidents', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchIncidents({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchIncidents', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchJobs', function() {

    it('should search jobs', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchJobs({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchJobs', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchMessageSubscriptions', function() {

    it('should search message subscriptions', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchMessageSubscriptions({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchMessageSubscriptions', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#searchUserTasks', function() {

    it('should search user tasks', function() {

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

      const processInstanceKey = '123';

      // when
      zeebeAPI.searchUserTasks({ endpoint }, processInstanceKey);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchUserTasks', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        processInstanceKey
      });

    });

  });


  describe('#getAuthorizations', function() {

    it('should get authorizations', function() {

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

      const resourceType = 'CLUSTER_VARIABLE';

      // when
      zeebeAPI.getAuthorizations({ endpoint }, resourceType);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:getAuthorizations', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        resourceType
      });

    });


    it('should get authorizations with pagination', function() {

      // given
      const backend = new MockBackend({ send: sinon.spy() });
      const zeebeAPI = new ZeebeAPI(backend);
      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };
      const page = { from: 100, limit: 100 };

      // when
      zeebeAPI.getAuthorizations({ endpoint }, 'CLUSTER_VARIABLE', page);

      // then
      expect(backend.send).to.have.been.calledWithMatch('zeebe:getAuthorizations', { page });
    });

  });


  describe('#evaluateExpression', function() {

    it('should evaluate expression', function() {

      // given
      const backend = new MockBackend({ send: sinon.spy() });
      const zeebeAPI = new ZeebeAPI(backend);
      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };
      const variables = {
        x: 2
      };

      // when
      zeebeAPI.evaluateExpression({ endpoint }, '=x + 1', variables);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:evaluateExpression', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        expression: '=x + 1',
        variables
      });
    });

  });


  describe('#searchClusterVariables', function() {

    it('should search cluster variables', function() {

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

      const filter = {
        metadata: {
          kind: { '$eq': 'CREDENTIAL' }
        }
      };

      // when
      zeebeAPI.searchClusterVariables({ endpoint }, filter);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:searchClusterVariables', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        filter
      });

    });


    it('should search cluster variables with pagination', function() {

      // given
      const backend = new MockBackend({ send: sinon.spy() });
      const zeebeAPI = new ZeebeAPI(backend);
      const endpoint = {
        targetType: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint: 'http://localhost:26500'
      };
      const page = { from: 100, limit: 100 };

      // when
      zeebeAPI.searchClusterVariables({ endpoint }, {}, page);

      // then
      expect(backend.send).to.have.been.calledWithMatch('zeebe:searchClusterVariables', { page });
    });

  });


  describe('#getClusterVariable', function() {

    it('should get cluster variable', function() {

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

      const name = 'MY_VAR';

      // when
      zeebeAPI.getClusterVariable({ endpoint }, name);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:getClusterVariable', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        name
      });

    });

  });


  describe('#createClusterVariable', function() {

    it('should create cluster variable', function() {

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

      const variable = {
        name: 'MY_VAR',
        value: '"secret"',
        kind: 'SECRET_REFERENCE'
      };

      // when
      zeebeAPI.createClusterVariable({ endpoint }, variable);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:createClusterVariable', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        variable
      });

    });

  });


  describe('#updateClusterVariable', function() {

    it('should update cluster variable', function() {

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

      const name = 'MY_VAR';

      const variable = {
        value: '"secret"'
      };

      // when
      zeebeAPI.updateClusterVariable({ endpoint }, name, variable);

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:updateClusterVariable', {
        endpoint: {
          type: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: endpoint.contactPoint,
          tenantId: undefined
        },
        name,
        variable
      });

    });

  });


  describe('#listSecrets', function() {

    it('should list secrets', function() {

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
      zeebeAPI.listSecrets({ endpoint });

      // then
      expect(backend.send).to.have.been.calledWith('zeebe:listSecrets', {
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
