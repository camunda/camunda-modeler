/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { validateProperties } from '../../../settings/SettingsForm';
import { properties as connectionProperties } from '../../connection-manager-plugin/ConnectionManagerSettingsProperties';
import { AUTH_TYPES, TARGET_TYPES } from '../../../../remote/ZeebeAPI';

// Helper to validate connection config using the generic validator
function validateConnectionConfig(connection) {
  return validateProperties(connection, connectionProperties);
}

describe('ConnectionConfigValidator', function() {

  describe('validateConnectionConfig', function() {

    it('should return error when connection is null', function() {
      const errors = validateConnectionConfig(null);
      expect(errors).to.have.property('_error');
    });


    it('should return error when connection is undefined', function() {
      const errors = validateConnectionConfig(undefined);
      expect(errors).to.have.property('_error');
    });


    describe('Camunda Cloud', function() {

      it('should validate valid Camunda Cloud config', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'client-id',
          camundaCloudClientSecret: 'client-secret',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        });

        expect(errors).to.deep.equal({});
      });


      it('should return error for missing clientId', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: '',
          camundaCloudClientSecret: 'client-secret',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        });

        expect(errors).to.have.property('camundaCloudClientId');
      });


      it('should return error for missing clientSecret', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'client-id',
          camundaCloudClientSecret: '',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
        });

        expect(errors).to.have.property('camundaCloudClientSecret');
      });


      it('should return error for missing clusterUrl', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'client-id',
          camundaCloudClientSecret: 'client-secret',
          camundaCloudClusterUrl: ''
        });

        expect(errors).to.have.property('camundaCloudClusterUrl');
      });


      it('should return error for invalid clusterUrl', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'client-id',
          camundaCloudClientSecret: 'client-secret',
          camundaCloudClusterUrl: 'http://localhost:8080'
        });

        expect(errors).to.have.property('camundaCloudClusterUrl');
      });

    });


    describe('Self-Hosted with no auth', function() {

      it('should validate valid self-hosted config without auth', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.NONE
        });

        expect(errors).to.deep.equal({});
      });


      it('should return error for missing contactPoint', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: '',
          authType: AUTH_TYPES.NONE
        });

        expect(errors).to.have.property('contactPoint');
      });


      it('should return error for invalid contactPoint URL', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'localhost:8080',
          authType: AUTH_TYPES.NONE
        });

        expect(errors).to.have.property('contactPoint');
      });

    });


    describe('Self-Hosted with Basic auth', function() {

      it('should validate valid self-hosted config with basic auth', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.BASIC,
          basicAuthUsername: 'user',
          basicAuthPassword: 'password'
        });

        expect(errors).to.deep.equal({});
      });


      it('should return error for missing basicAuthUsername', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.BASIC,
          basicAuthUsername: '',
          basicAuthPassword: 'password'
        });

        expect(errors).to.have.property('basicAuthUsername');
      });


      it('should return error for missing basicAuthPassword', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.BASIC,
          basicAuthUsername: 'user',
          basicAuthPassword: ''
        });

        expect(errors).to.have.property('basicAuthPassword');
      });

    });


    describe('Self-Hosted with OAuth', function() {

      it('should validate valid self-hosted config with OAuth', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.OAUTH,
          clientId: 'client-id',
          clientSecret: 'client-secret',
          oauthURL: 'http://localhost:18080/auth/token',
          audience: 'zeebe-api'
        });

        expect(errors).to.deep.equal({});
      });


      it('should return error for missing OAuth clientId', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.OAUTH,
          clientId: '',
          clientSecret: 'client-secret',
          oauthURL: 'http://localhost:18080/auth/token',
          audience: 'zeebe-api'
        });

        expect(errors).to.have.property('clientId');
      });


      it('should return error for missing OAuth clientSecret', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.OAUTH,
          clientId: 'client-id',
          clientSecret: '',
          oauthURL: 'http://localhost:18080/auth/token',
          audience: 'zeebe-api'
        });

        expect(errors).to.have.property('clientSecret');
      });


      it('should return error for missing oauthURL', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.OAUTH,
          clientId: 'client-id',
          clientSecret: 'client-secret',
          oauthURL: '',
          audience: 'zeebe-api'
        });

        expect(errors).to.have.property('oauthURL');
      });


      it('should return error for missing audience', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.OAUTH,
          clientId: 'client-id',
          clientSecret: 'client-secret',
          oauthURL: 'http://localhost:18080/auth/token',
          audience: ''
        });

        expect(errors).to.have.property('audience');
      });

    });


    describe('Conditional validation', function() {

      it('should not validate Camunda Cloud fields for self-hosted', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.NONE,

          // These should be ignored for self-hosted
          camundaCloudClientId: '',
          camundaCloudClientSecret: '',
          camundaCloudClusterUrl: ''
        });

        expect(errors).to.deep.equal({});
      });


      it('should not validate self-hosted fields for Camunda Cloud', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.CAMUNDA_CLOUD,
          camundaCloudClientId: 'client-id',
          camundaCloudClientSecret: 'client-secret',
          camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443',

          // These should be ignored for Camunda Cloud
          contactPoint: '',
          authType: AUTH_TYPES.NONE
        });

        expect(errors).to.deep.equal({});
      });


      it('should not validate OAuth fields for basic auth', function() {
        const errors = validateConnectionConfig({
          targetType: TARGET_TYPES.SELF_HOSTED,
          contactPoint: 'http://localhost:8080',
          authType: AUTH_TYPES.BASIC,
          basicAuthUsername: 'user',
          basicAuthPassword: 'password',

          // These should be ignored for basic auth
          clientId: '',
          clientSecret: '',
          oauthURL: '',
          audience: ''
        });

        expect(errors).to.deep.equal({});
      });

    });

  });

});
