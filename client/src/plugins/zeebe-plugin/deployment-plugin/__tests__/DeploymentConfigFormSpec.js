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

import { act } from 'react-dom/test-utils';

import { mount } from 'enzyme';

import { merge } from 'min-dash';

import DeploymentConfigForm from '../DeploymentConfigForm';

import { AUTH_TYPES, TARGET_TYPES } from '../../../../remote/ZeebeAPI';

describe('<DeploymentConfigForm>', function() {

  it('should render', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should render no header by default', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.find('.section__header').exists()).to.be.false;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = 'Custom Header';

    // when
    const wrapper = createDeploymentConfigForm({
      renderHeader
    });

    // then
    expect(wrapper.find('.section__header').exists()).to.be.true;
  });


  it('should render default submit button', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const wrapper = createDeploymentConfigForm({
      renderSubmit
    });

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql(renderSubmit);
  });


  describe('submission', function() {

    it('should submit', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        onSubmit: onSubmitSpy
      });

      // when

      await act(async () => {
        wrapper.find('button[type="submit"]').simulate('click');
      });

      wrapper.update();

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
    });

  });

});

const DEFAULT_INITIAL_FIELD_VALUES = {
  deployment: {},
  endpoint: {
    authType: AUTH_TYPES.NONE,
    targetType: TARGET_TYPES.CAMUNDA_CLOUD
  }
};

function createDeploymentConfigForm(props = {}) {
  let {
    getFieldError = (meta, fieldName) => {},
    initialFieldValues = {},
    onSubmit = () => {},
    renderHeader = null,
    renderSubmit = 'Submit',
    validateField = () => {},
    validateForm = () => {}
  } = props;

  initialFieldValues = merge({}, DEFAULT_INITIAL_FIELD_VALUES, initialFieldValues);

  return mount(<DeploymentConfigForm
    getFieldError={ getFieldError }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm } />);
}