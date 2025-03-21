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

import React from 'react';

import { waitFor } from '@testing-library/react';

import { mount } from 'enzyme';

import EndpointConfigForm from '../EndpointConfigForm';

import { AUTH_TYPES } from '../../shared/ZeebeAuthTypes';

import * as TARGET_TYPES from '../../shared/ZeebeTargetTypes';

describe.only('<EndpointConfigForm>', function() {

  it('should render', function() {

    // when
    const wrapper = createEndpointConfigForm();

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should render no header by default', function() {

    // when
    const wrapper = createEndpointConfigForm();

    // then
    expect(wrapper.find('.section__header').exists()).to.be.false;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = <h1>Custom Header</h1>;

    // when
    const wrapper = createEndpointConfigForm({
      renderHeader
    });

    // then
    expect(wrapper.find('.section__header').exists()).to.be.true;
  });


  it('should render default submit button', function() {

    // when
    const wrapper = createEndpointConfigForm();

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const wrapper = createEndpointConfigForm({
      renderSubmit
    });

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql(renderSubmit);
  });


  describe('fields', function() {

    describe('target', function() {

      it('should render');

    });


    describe('self-managed and no auth', function() {

      it('should render');

    });


    describe('self-managed and basic auth', function() {

      it('should render');

    });


    describe('self-managed and oauth', function() {

      it('should render');

    });


    describe('saas', function() {

      it('should render');

    });


    describe('remember credentials', function() {

      it('should render');

    });

  });


  describe('submission', function() {

    it('should submit');


    it('should be disabled when submitting');

  });


  describe('validation', function() {

    it('should validate on mount');

  });

});

const DEFAULT_INITIAL_FIELD_VALUES = {
  targetType: TARGET_TYPES.CAMUNDA_CLOUD,
  authType: AUTH_TYPES.NONE
};

function createEndpointConfigForm(props = {}) {
  const {
    getFieldError = () => {},
    initialFieldValues = DEFAULT_INITIAL_FIELD_VALUES,
    onSubmit = () => {},
    renderHeader = null,
    renderSubmit = 'Submit',
    validateFieldValue = () => {}
  } = props;

  return mount(<EndpointConfigForm
    getFieldError={ getFieldError }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateFieldValue={ validateFieldValue } />);
}