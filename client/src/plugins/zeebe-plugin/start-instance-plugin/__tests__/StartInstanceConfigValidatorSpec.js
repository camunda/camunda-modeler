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
import StartInstanceConfigValidator, { BUSINESS_ID_MAX_LENGTH, VALIDATION_ERROR_MESSAGES } from '../StartInstanceConfigValidator';

describe('<StartInstanceConfigValidator>', function() {

  describe('#validateConfigValue', function() {

    describe('variables', function() {

      it('should validate', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('variables', '{ "foo": "bar" }');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (invalid)', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('variables', '{');

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.VARIABLES_MUST_BE_VALID_JSON);
      });

    });


    describe('businessId', function() {

      it('should validate (empty)', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('businessId', '');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (valid)', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('businessId', 'order-1234');

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (at max length)', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('businessId', 'a'.repeat(BUSINESS_ID_MAX_LENGTH));

        // then
        expect(validationError).to.be.null;
      });


      it('should validate (too long)', function() {

        // when
        const validationError = StartInstanceConfigValidator.validateConfigValue('businessId', 'a'.repeat(BUSINESS_ID_MAX_LENGTH + 1));

        // then
        expect(validationError).to.eql(VALIDATION_ERROR_MESSAGES.BUSINESS_ID_TOO_LONG);
      });

    });

  });


  describe('#validateConfig', function() {

    describe('valid', function() {

      it('should be valid', function() {
        expectNoValidationErrors({
          variables: '{ "foo": "bar" }'
        });
      });


      it('should be valid (with businessId)', function() {
        expectNoValidationErrors({
          variables: '{ "foo": "bar" }',
          businessId: 'order-1234'
        });
      });

    });


    describe('invalid', function() {

      it('should not be valid', function() {
        expectValidationErrors({
          variables: '{'
        }, {
          'variables': VALIDATION_ERROR_MESSAGES.VARIABLES_MUST_BE_VALID_JSON
        });
      });


      it('should not be valid (businessId too long)', function() {
        expectValidationErrors({
          variables: '{}',
          businessId: 'a'.repeat(BUSINESS_ID_MAX_LENGTH + 1)
        }, {
          'businessId': VALIDATION_ERROR_MESSAGES.BUSINESS_ID_TOO_LONG
        });
      });

    });

  });

});

function expectValidationErrors(config, expectedValidationErrors) {

  // when
  const validationErrors = StartInstanceConfigValidator.validateConfig(config);

  // then
  expect(validationErrors).to.eql(expectedValidationErrors);
}

function expectNoValidationErrors(config) {

  // when
  const validationErrors = StartInstanceConfigValidator.validateConfig(config);

  // then
  for (const key in validationErrors) {
    expect(validationErrors[ key ]).to.be.null;
  }
}
