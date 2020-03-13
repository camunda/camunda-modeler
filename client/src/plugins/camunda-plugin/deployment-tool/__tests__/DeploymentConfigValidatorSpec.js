/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DeploymentConfigValidator from '../validation/DeploymentConfigValidator';
import AuthTypes from '../../shared/AuthTypes';

const EMPTY_ENDPOINT_ERROR = 'Endpoint URL must not be empty.';
const EMPTY_DEPLOYMENT_NAME_ERROR = 'Deployment name must not be empty.';
const EMPTY_USERNAME_ERROR = 'Username must not be empty.';
const EMPTY_PASSWORD_ERROR = 'Password must not be empty.';
const EMPTY_TOKEN_ERROR = 'Token must not be empty.';
const INVALID_URL_ERROR = 'Endpoint URL must start with "http://" or "https://".';


describe('<DeploymentConfigValidator>', () => {

  /**
   * @type {DeploymentConfigValidator}
   */
  let validator;

  beforeEach(() => {
    validator = new DeploymentConfigValidator();
  });


  it('should validate deployment name', () => {

    // given
    const validate = name => validator.validateDeployment({
      name
    });

    // then
    expect(validate().name).to.eql(EMPTY_DEPLOYMENT_NAME_ERROR);
    expect(validate('').name).to.eql(EMPTY_DEPLOYMENT_NAME_ERROR);
    expect(validate('deployment name').name).to.not.exist;
  });


  it('should validate endpoint url', () => {

    // given
    const validate = url => validator.validateEndpoint({
      authType: AuthTypes.basic,
      url
    });

    // then
    expect(validate().url).to.eql(EMPTY_ENDPOINT_ERROR);
    expect(validate('').url).to.eql(EMPTY_ENDPOINT_ERROR);
    expect(validate('url').url).to.eql(INVALID_URL_ERROR);
    expect(validate('http://localhost:8080').url).to.not.exist;
    expect(validate('https://localhost:8080').url).to.not.exist;
  });


  it('should validate username', () => {

    // given
    const validate = username => validator.validateEndpoint({
      authType: AuthTypes.basic,
      username
    });

    // then
    expect(validate().username).to.eql(EMPTY_USERNAME_ERROR);
    expect(validate('').username).to.eql(EMPTY_USERNAME_ERROR);
    expect(validate('username').username).to.not.exist;
  });


  it('should validate password', () => {

    // given
    const validate = password => validator.validateEndpoint({
      authType: AuthTypes.basic,
      password
    });

    // then
    expect(validate().password).to.eql(EMPTY_PASSWORD_ERROR);
    expect(validate('').password).to.eql(EMPTY_PASSWORD_ERROR);
    expect(validate('password').password).to.not.exist;
  });


  it('should validate token', () => {

    // given
    const validate = token => validator.validateEndpoint({
      authType: AuthTypes.bearer,
      token
    });

    // then
    expect(validate().token).to.eql(EMPTY_TOKEN_ERROR);
    expect(validate('').token).to.eql(EMPTY_TOKEN_ERROR);
    expect(validate('token').token).to.not.exist;
  });
});
