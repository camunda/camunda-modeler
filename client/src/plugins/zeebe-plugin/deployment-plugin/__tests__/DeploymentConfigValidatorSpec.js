/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DeploymentConfigValidator, { VALIDATION_ERROR_MESSAGES } from '../DeploymentConfigValidator';

import { AUTH_TYPES, TARGET_TYPES } from '../../../../remote/ZeebeAPI';

describe('<DeploymentConfigValidator>', function() {

  describe('#validateConfigValue', function() {

    describe('endpoint.audience', function() {

      it('should validate', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.audience', 'foo');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (invalid)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.audience', '');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.AUDIENCE_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.basicAuthPassword', function() {

      it('should validate', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthPassword', 'foo');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (invalid)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthPassword', '');

        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.basicAuthUsername', function() {

      it('should validate', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthUsername', 'foo');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (invalid)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthUsername', '');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.contactPoint', function() {

      it('should validate', function() {

        // when
        const validationErrors = [
          'http://localhost:26500',
          'https://localhost:26500',
          'https://camunda.io',
          'https://zeebe.camunda.io'
        ].map(value => DeploymentConfigValidator.validateConfigValue('endpoint.contactPoint', value));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.be.null;
        }
      });


      it('should validate (invalid, protocol)', function() {

        // when
        const validationErrors = [
          'ftp://camunda.io',
          'www.camunda.io',
          'localhost:26500',
        ].map(value => DeploymentConfigValidator.validateConfigValue('endpoint.contactPoint', value));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_START_WITH_PROTOCOL);
        }
      });


      it('should validate (invalid, empty)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.contactPoint', '');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.camundaCloudClusterUrl', function() {

      it('should validate', function() {

        // when
        const validationErrors = [
          'https://cluster-name.region-1.zeebe.camunda.io:443',
          'https://another-cluster-name.region-1.zeebe.camunda.io:443',
          'https://cluster-name.region-1.zeebe.camunda.io',
        ].map(value => DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClusterUrl', value));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.be.null;
        }
      });

      it('should validate (invalid)', function() {

        // when
        const validationErrors = [
          'http://cluster-name.region-1.zeebe.camunda.io:443',
          'http://cluster-name.region.zeebe.camunda.io:443',
          'http://cluster-name.zeebe.camunda.io:443',
          'ftp://cluster-name.region-1.zeebe.camunda.io:443'
        ].map(value => DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClusterUrl', value));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL);
        }
      });

      it('should validate (invalid, empty)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClusterUrl', '');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.oauthURL', function() {

      it('should validate', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.oauthURL', 'foo');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (invalid)', function() {

        // when
        const validationError = DeploymentConfigValidator.validateConfigValue('endpoint.oauthURL', '');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.OAUTH_URL_MUST_NOT_BE_EMPTY);
      });

    });


    describe('endpoint.camundaCloudClientId & endpoint.clientId', function() {

      it('should validate', function() {

        // when
        const validationErrors = [
          'endpoint.camundaCloudClientId',
          'endpoint.clientId'
        ].map(name => DeploymentConfigValidator.validateConfigValue(name, 'foo'));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.be.null;
        }
      });


      it('should validate (invalid)', function() {

        // when
        const validationErrors = [
          'endpoint.camundaCloudClientId',
          'endpoint.clientId'
        ].map(name => DeploymentConfigValidator.validateConfigValue(name, ''));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY);
        }
      });

    });


    describe('endpoint.camundaCloudClientSecret & endpoint.clientSecret', function() {

      it('should validate', function() {

        // when
        const validationErrors = [
          'endpoint.camundaCloudClientSecret',
          'endpoint.clientSecret'
        ].map(name => DeploymentConfigValidator.validateConfigValue(name, 'foo'));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.be.null;
        }
      });


      it('should validate (invalid)', function() {

        // when
        const validationErrors = [
          'endpoint.camundaCloudClientSecret',
          'endpoint.clientSecret'
        ].map(name => DeploymentConfigValidator.validateConfigValue(name, ''));

        // then
        for (const validationError of validationErrors) {
          expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY);
        }
      });

    });

  });


  describe('#validateConfig', function() {

    describe('valid', function() {

      it('Camunda 8 SaaS', function() {
        expectNoValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.CAMUNDA_CLOUD,
            camundaCloudClientId: 'foo',
            camundaCloudClientSecret: 'bar',
            camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
          }
        });
      });


      it('Camunda 8 self-managed (no auth)', function() {
        expectNoValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.NONE,
            contactPoint: 'http://localhost:26500'
          }
        });
      });


      it('Camunda 8 self-managed (basic auth)', function() {
        expectNoValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            contactPoint: 'http://localhost:26500',
            basicAuthUsername: 'foo',
            basicAuthPassword: 'bar'
          }
        });
      });


      it('Camunda 8 self-managed (oauth)', function() {
        expectNoValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'http://localhost:26500',
            oauthURL: 'http://localhost:26500/oauth',
            clientId: 'foo',
            clientSecret: 'bar',
            audience: 'baz'
          }
        });
      });

    });


    describe('invalid', function() {

      it('Camunda 8 SaaS (endpoint.camundaCloudClusterUrl empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.CAMUNDA_CLOUD,
            camundaCloudClientId: 'foo',
            camundaCloudClientSecret: 'bar',
            camundaCloudClusterUrl: ''
          }
        }, {
          'endpoint.camundaCloudClusterUrl': VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY
        });
      });


      it('Camunda 8 SaaS (endpoint.camundaCloudClusterUrl invalid)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.CAMUNDA_CLOUD,
            camundaCloudClientId: 'foo',
            camundaCloudClientSecret: 'bar',
            camundaCloudClusterUrl: 'baz'
          }
        }, {
          'endpoint.camundaCloudClusterUrl': VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL
        });
      });


      it('Camunda 8 SaaS (endpoint.camundaCloudClientId empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.CAMUNDA_CLOUD,
            camundaCloudClientId: '',
            camundaCloudClientSecret: 'foo',
            camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
          }
        }, {
          'endpoint.camundaCloudClientId': VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 SaaS (endpoint.camundaCloudClientSecret empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.CAMUNDA_CLOUD,
            camundaCloudClientId: 'foo',
            camundaCloudClientSecret: '',
            camundaCloudClusterUrl: 'https://cluster-name.region-1.zeebe.camunda.io:443'
          }
        }, {
          'endpoint.camundaCloudClientSecret': VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 self-managed (endpoint.contactPoint empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.NONE,
            contactPoint: ''
          }
        }, {
          'endpoint.contactPoint': VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY
        });
      });


      it('Camunda 8 self-managed (endpoint.basicAuthUsername empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            contactPoint: 'http://localhost:26500',
            basicAuthUsername: '',
            basicAuthPassword: 'foo'
          }
        }, {
          'endpoint.basicAuthUsername': VALIDATION_ERROR_MESSAGES.BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 self-managed (endpoint.basicAuthPassword empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            contactPoint: 'http://localhost:26500',
            basicAuthUsername: 'foo',
            basicAuthPassword: ''
          }
        }, {
          'endpoint.basicAuthPassword': VALIDATION_ERROR_MESSAGES.BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY
        });
      });


      it('Camunda 8 self-managed (endpoint.oauthURL empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'http://localhost:26500',
            oauthURL: '',
            clientId: 'foo',
            clientSecret: 'bar',
            audience: 'baz'
          }
        }, {
          'endpoint.oauthURL': VALIDATION_ERROR_MESSAGES.OAUTH_URL_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 self-managed (endpoint.clientId empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'http://localhost:26500',
            oauthURL: 'foo',
            clientId: '',
            clientSecret: 'bar',
            audience: 'baz'
          }
        }, {
          'endpoint.clientId': VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 self-managed (endpoint.clientSecret empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'http://localhost:26500',
            oauthURL: 'foo',
            clientId: 'bar',
            clientSecret: '',
            audience: 'baz'
          }
        }, {
          'endpoint.clientSecret': VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY,
        });
      });


      it('Camunda 8 self-managed (endpoint.audience empty)', function() {
        expectValidationErrors({
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'http://localhost:26500',
            oauthURL: 'foo',
            clientId: 'bar',
            clientSecret: 'baz',
            audience: ''
          }
        }, {
          'endpoint.audience': VALIDATION_ERROR_MESSAGES.AUDIENCE_MUST_NOT_BE_EMPTY
        });
      });

    });

  });

});

function expectValidationErrors(config, expectedValidationErrors) {

  // when
  const validationErrors = DeploymentConfigValidator.validateConfig(config);

  // then
  expect(validationErrors).to.eql(expectedValidationErrors);
}

function expectNoValidationErrors(config) {

  // when
  const validationErrors = DeploymentConfigValidator.validateConfig(config);

  // then
  for (const key in validationErrors) {
    expect(validationErrors[ key ]).to.be.null;
  }
}