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
import * as sinon from 'sinon';

import React from 'react';

import { render, fireEvent, act } from '@testing-library/react';

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


  describe('lint errors', function() {

    it('should show lint error feedback', function() {

      // when
      const { container } = createDeploymentConfigForm({
        hasLintErrors: true
      });

      // then
      expect(container.querySelector('.invalid-feedback')).to.exist;
      expect(container.querySelector('.invalid-feedback').textContent).to.include('has errors');
    });


    it('should not show lint error feedback if no lint errors', function() {

      // when
      const { container } = createDeploymentConfigForm({
        hasLintErrors: false
      });

      // then
      expect(container.querySelector('.invalid-feedback')).to.be.null;
    });


    it('should not show lint error feedback if connection check failed', function() {

      // when
      const { container } = createDeploymentConfigForm({
        hasLintErrors: true,
        connectionCheckResult: { success: false, reason: 'CONTACT_POINT_UNAVAILABLE' }
      });

      // then
      const feedback = container.querySelector('.invalid-feedback');
      expect(feedback).to.exist;
      expect(feedback.textContent).to.not.include('has errors');
      expect(feedback.textContent).to.include('Could not establish connection');
    });


    it('should open linting panel on click', function() {

      // given
      const handleOpenLintingPanelSpy = sinon.spy();

      const { container } = createDeploymentConfigForm({
        hasLintErrors: true,
        handleOpenLintingPanel: handleOpenLintingPanelSpy
      });

      // when
      fireEvent.click(container.querySelector('.invalid-feedback a'));

      // then
      expect(handleOpenLintingPanelSpy).to.have.been.calledOnce;
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
    connectionCheckResult,
    getFieldError = (meta, fieldName) => {},
    handleChangeConnections = () => {},
    handleManageConnections = () => {},
    handleOpenLintingPanel = () => {},
    hasLintErrors = false,
    initialFieldValues = {},
    onSubmit = () => {},
    renderHeader = null,
    renderSubmit = 'Submit',
    validateField = () => {},
    validateForm = () => {}
  } = props;

  initialFieldValues = merge({}, DEFAULT_INITIAL_FIELD_VALUES, initialFieldValues);

  return render(<DeploymentConfigForm
    connectionCheckResult={ connectionCheckResult }
    getFieldError={ getFieldError }
    handleChangeConnections={ handleChangeConnections }
    handleManageConnections={ handleManageConnections }
    handleOpenLintingPanel={ handleOpenLintingPanel }
    hasLintErrors={ hasLintErrors }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm } />);
}
