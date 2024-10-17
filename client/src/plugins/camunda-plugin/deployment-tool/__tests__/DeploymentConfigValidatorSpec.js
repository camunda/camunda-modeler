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

import DeploymentConfigValidator from '../validation/DeploymentConfigValidator';
import AUTH_TYPES from '../../shared/AuthTypes';

const EMPTY_ENDPOINT_ERROR = 'Endpoint URL must not be empty.';
const EMPTY_DEPLOYMENT_NAME_ERROR = 'Deployment name must not be empty.';
const FILE_NOT_FOUND_ERROR = 'File not found.';
const EMPTY_USERNAME_ERROR = 'Credentials are required to connect to the server.';
const EMPTY_PASSWORD_ERROR = 'Credentials are required to connect to the server.';
const EMPTY_TOKEN_ERROR = 'Token must not be empty.';
const INVALID_URL_ERROR = 'Endpoint URL must start with "http://" or "https://".';
const NON_COMPLETE_ERROR = 'Should point to a running Camunda REST API.';

const ENDPOINT_URL_FIELDNAME = 'endpoint.url';

const noop = () => {};

describe('<DeploymentConfigValidator>', function() {

  /**
   * @type {DeploymentConfigValidator}
   */
  let validator;

  beforeEach(function() {
    validator = new DeploymentConfigValidator();
  });


  it('should validate deployment name', function() {

    // given
    const validate = name => validator.validateDeploymentName(name, true);

    // then
    expect(validate()).to.eql(EMPTY_DEPLOYMENT_NAME_ERROR);
    expect(validate('')).to.eql(EMPTY_DEPLOYMENT_NAME_ERROR);
    expect(validate('deployment name')).to.not.exist;
  });


  it('should validate attachments', function() {

    // given
    const validate = attachments => validator.validateAttachments(attachments);

    // then
    expect(validate([])).to.not.exist;
    expect(validate([ { contents: 'content' } ])).to.not.exist;
    expect(validate([ { contents: null } ])).to.eql([ FILE_NOT_FOUND_ERROR ]);
    expect(validate([
      { contents: null },
      { contents: 'content' }
    ])).to.eql([ FILE_NOT_FOUND_ERROR, undefined ]);
  });


  it('should validate endpoint url', function() {

    // given
    const validate = url => validator.validateEndpoint({
      authType: AUTH_TYPES.BASIC,
      url
    });

    // then
    expect(validate().url).to.eql(EMPTY_ENDPOINT_ERROR);
    expect(validate('').url).to.eql(EMPTY_ENDPOINT_ERROR);
    expect(validate('url').url).to.eql(INVALID_URL_ERROR);
    expect(validate('http://localhost:8080').url).to.not.exist;
    expect(validate('https://localhost:8080').url).to.not.exist;
  });


  it('should validate username', function() {

    // given
    const validate = username => validator.validateUsername(username, true);

    // then
    expect(validate()).to.eql(EMPTY_USERNAME_ERROR);
    expect(validate('')).to.eql(EMPTY_USERNAME_ERROR);
    expect(validate('username')).to.not.exist;
  });


  it('should validate password', function() {

    // given
    const validate = password => validator.validatePassword(password, true);

    // then
    expect(validate()).to.eql(EMPTY_PASSWORD_ERROR);
    expect(validate('')).to.eql(EMPTY_PASSWORD_ERROR);
    expect(validate('password')).to.not.exist;
  });


  it('should validate token', function() {

    // given
    const validate = token => validator.validateToken(token, true);

    // then
    expect(validate()).to.eql(EMPTY_TOKEN_ERROR);
    expect(validate('')).to.eql(EMPTY_TOKEN_ERROR);
    expect(validate('token')).to.not.exist;
  });


  it('should validate endpoint URL completeness delayed if not submitting', function(done) {

    // given
    const setFieldErrorSpy = sinon.spy();
    const onAuthDetection = noop;
    const isOnBeforeSubmit = false;

    const nonCompleteURL = 'https://';

    // when
    const result = validator.validateEndpointURL(
      nonCompleteURL, setFieldErrorSpy, isOnBeforeSubmit, onAuthDetection
    );

    // then
    expect(result).to.be.null;
    expect(setFieldErrorSpy).to.not.have.been.called;
    setTimeout(() => {
      expect(setFieldErrorSpy).to.have.been.calledWith(ENDPOINT_URL_FIELDNAME, NON_COMPLETE_ERROR);
      done();
    }, 1001);
  });


  it('should validate endpoint URL completeness non delayed if submitting', function() {

    // given
    const setFieldErrorSpy = noop;
    const onAuthDetection = noop;
    const isOnBeforeSubmit = true;

    const nonCompleteURL = 'https://';

    // when
    const result = validator.validateEndpointURL(
      nonCompleteURL, setFieldErrorSpy, isOnBeforeSubmit, onAuthDetection
    );

    // then
    expect(result).to.be.eql(NON_COMPLETE_ERROR);
  });


  it('should discard timed out connection checks', async function() {

    // given
    validator.validateConnection = () => new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isSuccessful: true
        });
      }, 200);
    });

    // when
    const check1 = validator.validateConnectionWithoutCredentials('url1');
    const check2 = validator.validateConnectionWithoutCredentials('url2');

    const oldResponse = await check1;
    const newResponse = await check2;

    // then
    expect(oldResponse).to.eql({ isExpired: true });
    expect(newResponse).to.eql({ isSuccessful: true });
  });


  it('should skip deployment name validation after submission if not resubmitted', function() {

    // given
    const {
      validateDeploymentName
    } = validator;

    // when
    expect(validateDeploymentName(null, false)).to.eql(null);
    expect(validateDeploymentName(undefined, false)).to.eql(null);
    expect(validateDeploymentName('', false)).to.eql(null);
  });


  it('should skip username validation after submission if not resubmitted', function() {

    // given
    const {
      validateUsername
    } = validator;

    // when
    expect(validateUsername(null, false)).to.eql(null);
    expect(validateUsername(undefined, false)).to.eql(null);
    expect(validateUsername('', false)).to.eql(null);
  });


  it('should skip password validation after submission if not resubmitted', function() {

    // given
    const {
      validatePassword
    } = validator;

    // when
    expect(validatePassword(null, false)).to.eql(null);
    expect(validatePassword(undefined, false)).to.eql(null);
    expect(validatePassword('', false)).to.eql(null);
  });


  it('should have sticky username errors', function() {

    // given
    const {
      onExternalError,
      usernameValidator,
      validateUsername
    } = validator;

    usernameValidator.setCachedValue('username');

    // when
    onExternalError(AUTH_TYPES.BASIC, 'error', 'UNAUTHORIZED', noop);

    // then
    expect(validateUsername('username', false)).to.eql('error');
  });


  it('should have sticky password errors', function() {

    // given
    const {
      onExternalError,
      passwordValidator,
      validatePassword
    } = validator;

    passwordValidator.setCachedValue('password');

    // when
    onExternalError(AUTH_TYPES.BASIC, 'error', 'UNAUTHORIZED', noop);

    // then
    expect(validatePassword('password', false)).to.eql('error');
  });


  it('should have sticky token errors', function() {

    // given
    const {
      onExternalError,
      tokenValidator,
      validateToken
    } = validator;

    tokenValidator.setCachedValue('token');

    // when
    onExternalError(AUTH_TYPES.BEARER, 'error', 'UNAUTHORIZED', noop);

    // then
    expect(validateToken('token', false)).to.eql('error');
  });


  it('should notify connection status to parent', function(done) {

    // given
    const setFieldError = noop;
    const onAuthDetection = noop;
    const isOnBeforeSubmit = false;
    const onConnectionStatusUpdate = sinon.spy();

    const url = 'https://test.com';

    // when
    validator.endpointURLValidator.validateConnectionWithoutCredentials = () => {
      return new Promise((resolve, reject) => {
        resolve({
          code: 'CONNECTION_FAILED'
        });
      });
    };

    validator.validateEndpointURL(
      url, setFieldError, isOnBeforeSubmit, onAuthDetection, onConnectionStatusUpdate
    );

    // then
    setTimeout(() => {
      expect(onConnectionStatusUpdate).to.have.been.calledWith('CONNECTION_FAILED');
      done();
    }, 1500);
  });


  it('should cancel endpoint url validation', function(done) {

    // given
    const onConnectionStatusUpdate = sinon.spy();

    validator.validateConnectionWithoutCredentials = () => new Promise((resolve) => {
      setTimeout(() => { resolve({}); }, 100);
    });

    validator.endpointURLValidator.setTimeout('http://test.com', noop, noop, onConnectionStatusUpdate);

    // when
    validator.cancel();

    // then
    setTimeout(() => {
      expect(onConnectionStatusUpdate).to.not.have.been.called;
      done();
    }, 1000);
  });


  describe('#isConfigurationValid', function() {

    it('should return true for valid configuration', function() {

      // given
      const config = {
        deployment: {
          name: 'name',
          attachments: []
        },
        endpoint: {
          authType: AUTH_TYPES.BEARER,
          url: 'http://localhost',
          token: 'token',
        }
      };

      // then
      expect(validator.isConfigurationValid(config)).to.be.true;
    });


    it('should return false for missing attachments', function() {

      // given
      const config = {
        deployment: {
          name: 'name',
          attachments: [ {
            contents: null
          } ]
        },
        endpoint: {
          authType: AUTH_TYPES.BEARER,
          url: 'http://localhost',
          token: 'token',
        }
      };

      // then
      expect(validator.isConfigurationValid(config)).to.be.false;
    });


    it('should return false for missing configuration', function() {

      // then
      expect(validator.isConfigurationValid()).to.be.false;
    });


    // TODO(@barmac): The following test cases fail due to broken validation logic. To put it short,
    // most validators ignore invalid values if no `isOnBeforeSubmit` parameter is passed to them.
    // We should rewrite the validators so that they no longer care about the form state.
    it.skip('should return false for invalid configuration', function() {

      // given
      const config = {
        deployment: {
          name: '',
          attachments: []
        },
        endpoint: {
          authType: AUTH_TYPES.BEARER,
          url: 'http://localhost',
          token: '',
        }
      };

      // then
      expect(validator.isConfigurationValid(config)).to.be.false;
    });


    it.skip('should return false for missing endpoint', function() {

      // given
      const config = {
        deployment: {
          name: '',
          attachments: []
        }
      };

      // then
      expect(validator.isConfigurationValid(config)).to.be.false;
    });


    it.skip('should return false for missing deployment', function() {

      // given
      const config = {
        endpoint: {
          authType: AUTH_TYPES.BEARER,
          url: 'http://localhost',
          token: '',
        }
      };

      // then
      expect(validator.isConfigurationValid(config)).to.be.false;
    });
  });
});
