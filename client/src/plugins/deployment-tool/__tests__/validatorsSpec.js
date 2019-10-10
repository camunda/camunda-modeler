/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import validators from '../validators';


describe('<validators>', () => {

  it('should validate endpoint url', () => {

    // given
    const validate = validators.endpointUrl;

    // then
    expect(validate()).to.exist;
    expect(validate('')).to.exist;
    expect(validate('ftp://url')).to.exist;
    expect(validate('http://localhost:8080')).to.not.exist;
    expect(validate('https://localhost:8080')).to.not.exist;
  });


  it('should validate deployment name', () => {

    // given
    const validate = validators.deploymentName;

    // then
    expect(validate()).to.exist;
    expect(validate('')).to.exist;
    expect(validate('deployment name')).to.not.exist;
  });


  it('should validate username', () => {

    // given
    const validate = validators.username;

    // then
    expect(validate()).to.exist;
    expect(validate('')).to.exist;
    expect(validate('username')).to.not.exist;
  });


  it('should validate password', () => {

    // given
    const validate = validators.password;

    // then
    expect(validate()).to.exist;
    expect(validate('')).to.exist;
    expect(validate('password')).to.not.exist;
  });


  it('should validate bearer token', () => {

    // given
    const validate = validators.bearer;

    // then
    expect(validate()).to.exist;
    expect(validate('')).to.exist;
    expect(validate('token')).to.not.exist;
  });
});
