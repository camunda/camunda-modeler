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

import { render, fireEvent } from '@testing-library/react';

import { merge } from 'min-dash';

import DeploymentConfigForm from '../DeploymentConfigForm';

import { AUTH_TYPES, TARGET_TYPES } from '../../../../remote/ZeebeAPI';

describe('<DeploymentConfigForm>', function() {

  it('should render', function() {

    // when
    const { container } = createDeploymentConfigForm();

    // then
    expect(container.innerHTML).to.not.be.empty;
  });


  it('should render no header by default', function() {

    // when
    const { container } = createDeploymentConfigForm();

    // then
    expect(container.querySelector('.section__header')).to.be.null;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = 'Custom Header';

    // when
    const { container } = createDeploymentConfigForm({
      renderHeader
    });

    // then
    expect(container.querySelector('.section__header')).to.not.be.null;
  });


  it('should render default submit button', function() {

    // when
    const { container } = createDeploymentConfigForm();

    // then
    expect(container.querySelector('button[type="submit"]').textContent).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const { container } = createDeploymentConfigForm({
      renderSubmit
    });

    // then
    expect(container.querySelector('button[type="submit"]').textContent).to.eql(renderSubmit);
  });


  describe('submission', function() {

    it('should submit', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const { container } = createDeploymentConfigForm({
        onSubmit: onSubmitSpy
      });

      // when

      await act(async () => {
        fireEvent.click(container.querySelector('button[type="submit"]'));
      });

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

  return render(<DeploymentConfigForm
    getFieldError={ getFieldError }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm } />);
}