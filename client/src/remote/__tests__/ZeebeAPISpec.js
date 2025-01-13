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
  ENDPOINT_TYPES
} from '../ZeebeAPI';


describe('<ZeebeAPI>', function() {

  let backend,
      sendSpy;

  beforeEach(function() {
    sendSpy = sinon.spy();

    backend = new BackendMock({
      sendSpy
    });
  });

  describe('#checkConnection', function() {

    it('should check on self hosted', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: contactPoint
        }
      });
    });


    it('should check on basic auth', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        basicAuthUsername: 'username',
        basicAuthPassword: 'password',
        contactPoint
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          url: contactPoint,
          basicAuthUsername: 'username',
          basicAuthPassword: 'password'
        }
      });
    });


    it('should check on oauth', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const targetType = ENDPOINT_TYPES.SELF_HOSTED;
      const authType = AUTH_TYPES.OAUTH;
      const contactPoint = 'contactPoint';
      const oauthURL = 'oauthURL';
      const audience = 'audience';
      const scope = 'scope';
      const clientId = 'oauthClientId';
      const clientSecret = 'oauthClientSecret';
      const endpoint = {
        targetType,
        authType,
        contactPoint,
        oauthURL,
        audience,
        scope,
        clientId,
        clientSecret
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: contactPoint,
          oauthURL,
          audience,
          scope,
          clientId,
          clientSecret
        }
      });
    });


    it('should check on camunda cloud', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const targetType = ENDPOINT_TYPES.CAMUNDA_CLOUD;
      const camundaCloudClientId = 'camundaCloudClientId';
      const camundaCloudClientSecret = 'camundaCloudClientSecret';
      const camundaCloudClusterUrl = 'camundaCloudClusterUrl';
      const endpoint = {
        targetType,
        camundaCloudClientId,
        camundaCloudClientSecret,
        camundaCloudClusterUrl
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          clientId: camundaCloudClientId,
          clientSecret: camundaCloudClientSecret,
          url: camundaCloudClusterUrl
        }
      });

    });

  });


  describe('#run', function() {

    it('should execute', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const processId = 'processId';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint
      };

      // when
      zeebeAPI.run({
        processId,
        endpoint
      });

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:run', {
        processId,
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: contactPoint
        }
      });

    });

  });


  describe('#deploy', function() {

    it('should deploy without auth', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const filePath = 'filePath';

      const name = 'deployment';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint
      };

      // when
      zeebeAPI.deploy({
        filePath,
        name,
        endpoint
      });

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:deploy', {
        filePath,
        name,
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: contactPoint
        }
      });

    });


    it('should deploy with basic auth', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const filePath = 'filePath';

      const name = 'deployment';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        basicAuthUsername: 'username',
        basicAuthPassword: 'password',
        contactPoint
      };

      // when
      zeebeAPI.deploy({
        filePath,
        name,
        endpoint
      });

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:deploy', {
        filePath,
        name,
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          url: contactPoint,
          basicAuthUsername: 'username',
          basicAuthPassword: 'password'
        }
      });
    });


    it('should deploy with OAuth', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const filePath = 'filePath';

      const name = 'deployment';

      const tenantId = 'tenant-1';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        contactPoint,
        oauthURL: 'oauthURL',
        audience: 'audience',
        scope: 'scope',
        clientId: 'oauthClientId',
        clientSecret: 'oauthClientSecret'
      };

      // when
      zeebeAPI.deploy({
        filePath,
        name,
        endpoint,
        tenantId
      });

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:deploy', {
        filePath,
        name,
        tenantId,
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.OAUTH,
          url: contactPoint,
          oauthURL: 'oauthURL',
          audience: 'audience',
          scope: 'scope',
          clientId: 'oauthClientId',
          clientSecret: 'oauthClientSecret'
        }
      });

    });

  });


  describe('#getGatewayVersion', function() {

    it('should execute', function() {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const contactPoint = 'contactPoint';

      const endpoint = {
        targetType: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        contactPoint
      };

      // when
      zeebeAPI.getGatewayVersion(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:getGatewayVersion', {
        endpoint: {
          type: ENDPOINT_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.NONE,
          url: contactPoint
        }
      });

    });

  });

});


// helpers ////////////////

class BackendMock {

  constructor(options) {
    this._sendSpy = options.sendSpy;
  }

  send(event, options) {
    this._sendSpy && this._sendSpy(event, options);
  }

}
