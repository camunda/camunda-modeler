/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import StartInstanceConfigValidator, { VALIDATION_ERROR_MESSAGES } from '../StartInstanceConfigValidator';

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

  });


  describe('#validateConfig', function() {

    describe('valid', function() {

      it('should be valid', function() {
        expectNoValidationErrors({
          variables: '{ "foo": "bar" }'
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