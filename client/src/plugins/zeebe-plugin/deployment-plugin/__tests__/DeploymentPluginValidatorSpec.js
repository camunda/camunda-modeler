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

import DeploymentPluginValidator from '../DeploymentPluginValidator';

import {
  CONTACT_POINT_MUST_NOT_BE_EMPTY,
  CONTACT_POINT_MUST_START_WITH_PROTOCOL,
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY,
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY,
  OAUTH_URL_MUST_NOT_BE_EMPTY,
  AUDIENCE_MUST_NOT_BE_EMPTY,
  CLIENT_ID_MUST_NOT_BE_EMPTY,
  CLIENT_SECRET_MUST_NOT_BE_EMPTY,
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL,
  CONTACT_POINT_MUST_BE_URL
} from '../DeploymentPluginConstants';


describe('<DeploymentPluginValidator> (Zeebe)', function() {

  describe('Basic validation', function() {

    const validator = new DeploymentPluginValidator(null);

    it('should validate Zeebe contact point - IP address', function() {

      // given
      const emptyZeebeContactPoint = '';
      const noPortZeebeContactPoint = '0.0.0.0';
      const noProtocolZeebeContactPoint = '0.0.0.0:0001';
      const invalidUrlZeebeContactPoint = 'http://\\';
      const validZeebeContactPoint = 'http://localhost:26500';

      // then
      expect(validator.validateZeebeContactPoint(emptyZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_NOT_BE_EMPTY);
      expect(validator.validateZeebeContactPoint(noProtocolZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_START_WITH_PROTOCOL);
      expect(validator.validateZeebeContactPoint(noPortZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_START_WITH_PROTOCOL);
      expect(validator.validateZeebeContactPoint(noPortZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_START_WITH_PROTOCOL);
      expect(validator.validateZeebeContactPoint(invalidUrlZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_BE_URL);
      expect(validator.validateZeebeContactPoint(validZeebeContactPoint)).to.not.exist;
    });


    it('should validate Zeebe contact point - URL', function() {

      // given
      const emptyZeebeContactPoint = '';
      const noPortZeebeContactPoint = 'foo.bar';
      const missingProtocolZeebeContactPoint = 'foo.bar:0001';
      const validZeebeContactPointFullURL = 'https://foo.bar:0001';
      const validZeebeContactPointNoPortURL = 'https://foo.bar';

      // then
      expect(validator.validateZeebeContactPoint(emptyZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_NOT_BE_EMPTY);
      expect(validator.validateZeebeContactPoint(noPortZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_START_WITH_PROTOCOL);
      expect(validator.validateZeebeContactPoint(missingProtocolZeebeContactPoint)).to.eql(CONTACT_POINT_MUST_START_WITH_PROTOCOL);
      expect(validator.validateZeebeContactPoint(validZeebeContactPointFullURL)).to.not.exist;
      expect(validator.validateZeebeContactPoint(validZeebeContactPointNoPortURL)).to.not.exist;

    });


    it('should validate basic auth username', function() {

      // given
      const nonValidBasicAuthUsername = '';
      const validBasicAuthUsername = 'validBasicAuthUsername';

      // then
      expect(validator.validateBasicAuthUsername(nonValidBasicAuthUsername)).to.eql(BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY);
      expect(validator.validateBasicAuthUsername(validBasicAuthUsername)).to.not.exist;
    });


    it('should validate basic auth password', function() {

      // given
      const nonValidBasicAuthPassword = '';
      const validBasicAuthPassword = 'validBasicAuthPassword';

      // then
      expect(validator.validateBasicAuthPassword(nonValidBasicAuthPassword)).to.eql(BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY);
      expect(validator.validateBasicAuthPassword(validBasicAuthPassword)).to.not.exist;
    });


    it('should validate OAuth URL', function() {

      // given
      const nonValidOAuthURL = '';
      const validOAuthURL = 'validOAuthURL';

      // then
      expect(validator.validateOAuthURL(nonValidOAuthURL)).to.eql(OAUTH_URL_MUST_NOT_BE_EMPTY);
      expect(validator.validateOAuthURL(validOAuthURL)).to.not.exist;
    });


    it('should validate audience', function() {

      // given
      const nonValidAudience = '';
      const validAudience = 'validAudience';

      // then
      expect(validator.validateAudience(nonValidAudience)).to.eql(AUDIENCE_MUST_NOT_BE_EMPTY);
      expect(validator.validateAudience(validAudience)).to.not.exist;
    });


    it.skip('should validate scope');


    it('should validate client id', function() {

      // given
      const nonValidClientId = '';
      const validClientId = 'validClientId';

      // then
      expect(validator.validateClientId(nonValidClientId)).to.eql(CLIENT_ID_MUST_NOT_BE_EMPTY);
      expect(validator.validateClientId(validClientId)).to.not.exist;
    });


    it('should validate client secret', function() {

      // given
      const nonValidClientSecret = '';
      const validClientSecret = 'validClientSecret';

      // then
      expect(validator.validateClientSecret(nonValidClientSecret)).to.eql(CLIENT_SECRET_MUST_NOT_BE_EMPTY);
      expect(validator.validateClientSecret(validClientSecret)).to.not.exist;
    });


    it('should validate cluster url', function() {

      // given
      const nonValidClusterUrl = '';
      const nonValidClusterUrlHttps = 'https://asdf2-a1213-123a.ber-05.zeebe.notCamunda.io:443';
      const validClusterUrlHttps = 'https://asdf2-a1213-123a.ber-05.zeebe.camunda.io:443';
      const validClusterUrlHttpsSlash = 'https://asdf2-a1213-123a.ber-05.zeebe.camunda.io:443/';
      const validClusterUrlHttpsNoPort = 'https://asdf2-a1213-123a.ber-05.zeebe.camunda.io';
      const validClusterUrlHttpsNoPortSlash = 'https://asdf2-a1213-123a.ber-05.zeebe.camunda.io/';
      const validClusterUrl = 'asdf2-a1213-123a.ber-05.zeebe.camunda.io:443';
      const validClusterUrlSlash = 'asdf2-a1213-123a.ber-05.zeebe.camunda.io:443/';

      // then
      expect(validator.validateClusterUrl(nonValidClusterUrl)).to.eql(CLUSTER_URL_MUST_BE_VALID_CLOUD_URL);
      expect(validator.validateClusterUrl(nonValidClusterUrlHttps)).to.eql(CLUSTER_URL_MUST_BE_VALID_CLOUD_URL);
      expect(validator.validateClusterUrl(validClusterUrlHttps)).to.not.exist;
      expect(validator.validateClusterUrl(validClusterUrlHttpsSlash)).to.not.exist;
      expect(validator.validateClusterUrl(validClusterUrlHttpsNoPort)).to.not.exist;
      expect(validator.validateClusterUrl(validClusterUrlHttpsNoPortSlash)).to.not.exist;
      expect(validator.validateClusterUrl(validClusterUrl)).to.not.exist;
      expect(validator.validateClusterUrl(validClusterUrlSlash)).to.not.exist;
    });


    it('should validate config (camunda cloud)', function() {

      // given
      const config = {
        deployment: {
          name: 'name'
        },
        endpoint: {
          targetType: 'camundaCloud',
          camundaCloudClientId: 'test',
          camundaCloudClientSecret: 'test',
          camundaCloudClusterUrl: 'a213-asdf1-312as.bru-02.zeebe.camunda.io:443'
        }
      };
      const wrongConfig = {
        deployment: {
          name: 'name'
        },
        endpoint: {
          targetType: 'camundaCloud',
          camundaCloudClientId: 'test'
        }
      };

      // then
      expect(Object.keys(validator.validateConfig(config))).to.have.lengthOf(0);
      expect(Object.keys(validator.validateConfig(wrongConfig))).to.have.lengthOf(2);
    });


    it('should validate config (self hosted none auth)', function() {

      // given
      const config = {
        deployment: {
          name: 'name'
        },
        endpoint: {
          targetType: 'selfHosted',
          authType: 'none',
          contactPoint: 'https://camunda.com:0001'
        }
      };

      const wrongConfig = {
        deployment: {},
        endpoint: {
          targetType: 'selfHosted',
          authType: 'none',
          contactPoint: 'ftp://camunda.com'
        }
      };

      // then
      expect(Object.keys(validator.validateConfig(config))).to.have.lengthOf(0);
      expect(Object.keys(validator.validateConfig(wrongConfig))).to.have.lengthOf(2);
    });


    it('should validate config (self hosted oauth)', function() {

      // given
      const config = {
        deployment: {
          name: 'name'
        },
        endpoint: {
          targetType: 'selfHosted',
          authType: 'oauth',
          contactPoint: 'https://camunda.com:0001',
          oauthURL: 'https://camunda.com',
          audience: 'bearer',
          clientId: 'test',
          clientSecret: 'test'
        }
      };

      const wrongConfig = {
        deployment: {
          name: 'name'
        },
        endpoint: {
          targetType: 'selfHosted',
          authType: 'oauth',
          contactPoint: 'ftp://camunda.com',
          oauthURL: 'https://camunda.com'
        }
      };

      // then
      expect(Object.keys(validator.validateConfig(config))).to.have.lengthOf(0);
      expect(Object.keys(validator.validateConfig(wrongConfig))).to.have.lengthOf(4);
    });
  });


  describe('<ConnectionChecker>', function() {

    it('should be created', function() {

      // given
      const connectionChecker = createConnectionChecker();

      // then
      expect(connectionChecker).to.exist;
    });


    describe('#check', function() {

      it('should work', async function() {

        // given
        const connectionChecker = createConnectionChecker();

        // when
        const { connectionResult } = await connectionChecker.check({});

        // then
        expect(connectionResult).to.eql({ success: true, response: {} });
      });


      it('should return last result if endpoint did not change', async function() {

        // given
        const spy = sinon.spy(() => Promise.resolve({ success: true, response: {} }));
        const endpoint = {};
        const connectionChecker = createConnectionChecker(spy);

        // when
        await connectionChecker.check(endpoint);
        await connectionChecker.check(endpoint);

        // then
        expect(spy).to.have.been.calledOnce;
      });


      it('should check again if endpoint changed', async function() {

        // given
        const spy = sinon.spy(() => Promise.resolve({ success: true, response: {} }));
        const endpoint = {};
        const connectionChecker = createConnectionChecker(spy);

        // when
        await connectionChecker.check(endpoint);
        await connectionChecker.check({ url: 'new' });

        // then
        expect(spy).to.have.been.calledTwice;
      });

    });


    describe('#subscribe', function() {

      it('should work', async function() {

        // given
        const onStart = sinon.spy();
        const onComplete = sinon.spy();
        const connectionChecker = createConnectionChecker();
        connectionChecker.subscribe({ onStart, onComplete });

        // when
        const result = await connectionChecker.check({});

        // then
        expect(onStart).to.have.been.calledOnce;
        expect(onComplete).to.have.been.calledOnce;
        expect(onComplete.args).to.eql([ [ result ] ]);
      });

    });


    describe('#unsubscribe', function() {

      it('should work', async function() {

        // given
        const onStart = sinon.spy();
        const onComplete = sinon.spy();
        const connectionChecker = createConnectionChecker();
        connectionChecker.subscribe({ onStart, onComplete });
        connectionChecker.unsubscribe();

        // when
        await connectionChecker.check({});

        // then
        expect(onStart).not.to.have.been.called;
        expect(onComplete).not.to.have.been.called;
      });

    });

  });
});



// helper
function createConnectionChecker(checkConnection, useRealDelays) {
  const zeebeAPI = new MockZeebeAPI(checkConnection);
  const validator = new DeploymentPluginValidator(zeebeAPI);

  const connectionChecker = validator.createConnectionChecker();

  if (!useRealDelays) {
    connectionChecker.getCheckDelay = () => 0;
  }

  return connectionChecker;
}

function MockZeebeAPI(checkConnection) {
  const mockCheck = () => Promise.resolve({ success: true, response: {} });
  this.checkConnection = checkConnection || mockCheck;
}
