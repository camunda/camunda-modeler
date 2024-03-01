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

  beforeEach(() => {
    sendSpy = sinon.spy();

    backend = new BackendMock({
      sendSpy
    });
  });

  describe('#checkConnection', () => {

    it('should check on self hosted', () => {

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
          url: contactPoint
        }
      });
    });


    it('should check on oauth', () => {

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
          type: 'oauth',
          url: contactPoint,
          oauthURL,
          audience,
          scope,
          clientId,
          clientSecret
        }
      });
    });


    it('should check on camunda cloud', () => {

      // given
      const zeebeAPI = new ZeebeAPI(backend);

      const targetType = ENDPOINT_TYPES.CAMUNDA_CLOUD;
      const camundaCloudClientId = 'camundaCloudClientId';
      const camundaCloudClientSecret = 'camundaCloudClientSecret';
      const camundaCloudClusterId = 'camundaCloudClusterId';
      const endpoint = {
        targetType,
        camundaCloudClientId,
        camundaCloudClientSecret,
        camundaCloudClusterId
      };

      // when
      zeebeAPI.checkConnection(endpoint);

      // then
      expect(sendSpy).to.have.been.calledWith('zeebe:checkConnection', {
        endpoint: {
          type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
          clientId: camundaCloudClientId,
          clientSecret: camundaCloudClientSecret,
          clusterId: camundaCloudClusterId
        }
      });

    });

  });


  describe('#run', () => {

    it('should execute', () => {

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
          url: contactPoint
        }
      });

    });

  });


  describe('#deploy', () => {

    it('should deploy without OAuth', () => {

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
          url: contactPoint
        }
      });

    });


    it('should deploy with OAuth', () => {

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
          type: AUTH_TYPES.OAUTH,
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


  describe('#getGatewayVersion', () => {

    it('should execute', () => {

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
